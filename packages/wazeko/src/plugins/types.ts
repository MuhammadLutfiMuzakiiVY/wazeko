import { Message, Jid } from "../../../wazeko-types/src/index.js";
import { Wazeko } from "../client.js";

export interface CommandContext {
  client: Wazeko;
  message: Message;
  senderJid: Jid;
  chatJid: Jid;
  isGroup: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
  commandName: string;
  args: string[];
  reply: (text: string) => Promise<Message>;
  state: Record<string, any>;
}

export type NextFn = () => Promise<void>;
export type MiddlewareFn = (ctx: CommandContext, next: NextFn) => Promise<void>;

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description?: string;
  category?: string;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  cooldownSeconds?: number;
  execute: (ctx: CommandContext) => Promise<void>;
  filePath?: string;
}
