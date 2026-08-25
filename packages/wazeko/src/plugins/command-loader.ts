import { EventEmitter } from "events";
import * as path from "path";
import { pathToFileURL } from "url";
import { CommandDefinition, CommandContext } from "./types.js";
import { MiddlewarePipeline } from "./middleware.js";
import { Wazeko } from "../client.js";
import { Message, MessageContent } from "../../../wazeko-types/src/index.js";

export interface CommandRegistryOptions {
  prefix?: string | RegExp;
  ownerJids?: string[];
}

function extractMessageText(content: MessageContent): string {
  if ("text" in content && typeof content.text === "string") {
    return content.text;
  }
  if ("caption" in content && typeof content.caption === "string") {
    return content.caption;
  }
  if ("reply" in content && typeof content.reply.text === "string") {
    return content.reply.text;
  }
  return "";
}

export class CommandRegistry extends EventEmitter {
  private commands = new Map<string, CommandDefinition>();
  private aliases = new Map<string, string>();
  private fileMap = new Map<string, string[]>(); // filePath -> commandNames[]
  private pipeline = new MiddlewarePipeline();
  private prefix: string | RegExp;
  private ownerJids: Set<string>;

  constructor(options: CommandRegistryOptions = {}) {
    super();
    this.prefix = options.prefix ?? "!";
    this.ownerJids = new Set(options.ownerJids ?? []);

    // Setup default pipeline
    this.pipeline.use(MiddlewarePipeline.createExecutionLogger((ctx, duration, err) => {
      this.emit("command:executed", {
        command: ctx.commandName,
        sender: ctx.senderJid.user,
        durationMs: duration,
        error: err,
      });
    }));
    this.pipeline.use(MiddlewarePipeline.createAdminGuard());
    this.pipeline.use(MiddlewarePipeline.createCooldownGuard());
  }

  getPipeline(): MiddlewarePipeline {
    return this.pipeline;
  }

  register(command: CommandDefinition): void {
    const name = command.name.toLowerCase();
    this.commands.set(name, command);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias.toLowerCase(), name);
      }
    }

    if (command.filePath) {
      const normalizedPath = path.resolve(command.filePath);
      const existing = this.fileMap.get(normalizedPath) ?? [];
      existing.push(name);
      this.fileMap.set(normalizedPath, existing);
    }

    this.emit("command:registered", command);
  }

  unregister(name: string): boolean {
    const lower = name.toLowerCase();
    const command = this.commands.get(lower);
    if (!command) return false;

    this.commands.delete(lower);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.delete(alias.toLowerCase());
      }
    }

    if (command.filePath) {
      const normalized = path.resolve(command.filePath);
      const list = this.fileMap.get(normalized);
      if (list) {
        this.fileMap.set(normalized, list.filter((n) => n !== lower));
      }
    }

    this.emit("command:unregistered", lower);
    return true;
  }

  getCommand(query: string): CommandDefinition | undefined {
    const lower = query.toLowerCase();
    if (this.commands.has(lower)) {
      return this.commands.get(lower);
    }
    const resolvedName = this.aliases.get(lower);
    if (resolvedName) {
      return this.commands.get(resolvedName);
    }
    return undefined;
  }

  listCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Dynamically imports or re-imports an ESM command file using query cache-busting (?t=timestamp)
   */
  async loadModule(filePath: string): Promise<CommandDefinition[]> {
    const absolutePath = path.resolve(filePath);

    // Unregister any prior commands registered from this file path
    const oldCommands = this.fileMap.get(absolutePath);
    if (oldCommands) {
      for (const name of oldCommands) {
        this.unregister(name);
      }
    }

    // Cache-bust import using file URL
    const fileUrl = `${pathToFileURL(absolutePath).href}?update=${Date.now()}`;
    const importedModule = await import(fileUrl);

    const loaded: CommandDefinition[] = [];

    // Support both default export and named export arrays/commands
    const candidates = [
      importedModule.default,
      importedModule.command,
      importedModule.commands,
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        for (const item of candidate) {
          if (item && typeof item.execute === "function" && item.name) {
            item.filePath = absolutePath;
            this.register(item);
            loaded.push(item);
          }
        }
      } else if (candidate && typeof candidate.execute === "function" && candidate.name) {
        candidate.filePath = absolutePath;
        this.register(candidate);
        loaded.push(candidate);
      }
    }

    this.emit("module:loaded", { filePath: absolutePath, count: loaded.length });
    return loaded;
  }

  /**
   * Processes an incoming message and executes matching command if detected
   */
  async handleMessage(client: Wazeko, message: Message): Promise<boolean> {
    const text = extractMessageText(message.content);
    if (!text) return false;

    let matchPrefix = false;
    let stripped = text;

    if (typeof this.prefix === "string") {
      if (text.startsWith(this.prefix)) {
        matchPrefix = true;
        stripped = text.slice(this.prefix.length);
      }
    } else if (this.prefix instanceof RegExp) {
      const match = text.match(this.prefix);
      if (match) {
        matchPrefix = true;
        stripped = text.slice(match[0].length);
      }
    }

    if (!matchPrefix) return false;

    const parts = stripped.trim().split(/\s+/);
    const commandName = parts[0]?.toLowerCase();
    if (!commandName) return false;

    const command = this.getCommand(commandName);
    if (!command) return false;

    const args = parts.slice(1);
    const senderJid = message.source.sender;
    const chatJid = message.source.chat;
    const isGroup = message.source.isGroup;
    const isOwner = this.ownerJids.has(senderJid.user);

    const ctx: CommandContext = {
      client,
      message,
      senderJid,
      chatJid,
      isGroup,
      isAdmin: false, // Can be augmented by group metadata
      isOwner,
      commandName,
      args,
      reply: (replyText: string) => client.reply(message, replyText),
      state: { command },
    };

    await this.pipeline.execute(ctx, async () => {
      await command.execute(ctx);
    });

    return true;
  }
}
