export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LoggerOptions {
  level?: LogLevel;
  service?: string;
  destination?: (jsonString: string) => void;
}

export class StructuredLogger {
  private level: LogLevel;
  private service: string;
  private destination: (jsonString: string) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.service = options.service ?? "wazeko";
    this.destination = options.destination ?? ((str) => process.stdout.write(str + "\n"));
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_WEIGHTS[level] >= LOG_LEVEL_WEIGHTS[this.level];
  }

  private formatError(err: any): Record<string, any> | undefined {
    if (!err) return undefined;
    if (err instanceof Error) {
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: (err as any).code,
      };
    }
    return { raw: String(err) };
  }

  private log(level: LogLevel, message: string, meta: Record<string, any> = {}, error?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      msg: message,
      ...meta,
      ...(error ? { err: this.formatError(error) } : {}),
    };

    this.destination(JSON.stringify(entry));
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, any>, error?: any): void {
    this.log("warn", message, meta, error);
  }

  error(message: string, error?: any, meta?: Record<string, any>): void {
    this.log("error", message, meta, error);
  }

  /**
   * Helper to profile execution duration of an async action
   */
  async time<T>(name: string, fn: () => Promise<T>, meta: Record<string, any> = {}): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = Number((performance.now() - start).toFixed(2));
      this.info(`${name} completed`, { ...meta, durationMs });
      return result;
    } catch (err) {
      const durationMs = Number((performance.now() - start).toFixed(2));
      this.error(`${name} failed`, err, { ...meta, durationMs });
      throw err;
    }
  }
}
