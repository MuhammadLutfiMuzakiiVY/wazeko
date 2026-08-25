import { CommandContext, MiddlewareFn, NextFn, CommandDefinition } from "./types.js";

export class MiddlewarePipeline {
  private middlewares: MiddlewareFn[] = [];

  use(fn: MiddlewareFn): this {
    this.middlewares.push(fn);
    return this;
  }

  /**
   * Executes the onion pipeline around the final target handler
   */
  async execute(ctx: CommandContext, target: () => Promise<void>): Promise<void> {
    let index = -1;

    const runner = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times in middleware");
      }
      index = i;

      if (i === this.middlewares.length) {
        await target();
        return;
      }

      const middleware = this.middlewares[i];
      await middleware(ctx, () => runner(i + 1));
    };

    await runner(0);
  }

  // Built-in middleware factories
  static createAdminGuard(): MiddlewareFn {
    return async (ctx: CommandContext, next: NextFn) => {
      const cmd = ctx.state.command as CommandDefinition | undefined;
      if (cmd?.adminOnly && !ctx.isAdmin && !ctx.isOwner) {
        await ctx.reply("❌ Perintah ini hanya dapat digunakan oleh Admin Grup.");
        return;
      }
      if (cmd?.ownerOnly && !ctx.isOwner) {
        await ctx.reply("❌ Perintah ini hanya dapat digunakan oleh Bot Owner.");
        return;
      }
      await next();
    };
  }

  static createCooldownGuard(): MiddlewareFn {
    const userCooldowns = new Map<string, number>();

    return async (ctx: CommandContext, next: NextFn) => {
      const cmd = ctx.state.command as CommandDefinition | undefined;
      const cooldownSec = cmd?.cooldownSeconds ?? 0;

      if (cooldownSec > 0) {
        const key = `${ctx.senderJid.user}:${cmd?.name}`;
        const lastTime = userCooldowns.get(key) ?? 0;
        const elapsed = (Date.now() - lastTime) / 1000;

        if (elapsed < cooldownSec) {
          const remaining = (cooldownSec - elapsed).toFixed(1);
          await ctx.reply(`⏳ Mohon tunggu ${remaining} detik sebelum menggunakan perintah ini lagi.`);
          return;
        }

        userCooldowns.set(key, Date.now());
      }

      await next();
    };
  }

  static createExecutionLogger(onLog?: (ctx: CommandContext, durationMs: number, error?: Error) => void): MiddlewareFn {
    return async (ctx: CommandContext, next: NextFn) => {
      const start = Date.now();
      try {
        await next();
        const duration = Date.now() - start;
        if (onLog) onLog(ctx, duration);
      } catch (err: any) {
        const duration = Date.now() - start;
        if (onLog) onLog(ctx, duration, err);
        throw err;
      }
    };
  }
}
