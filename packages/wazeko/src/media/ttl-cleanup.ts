import * as fsp from "fs/promises";
import * as path from "path";

export interface CleanupOptions {
  tempDir: string;
  ttlMs?: number; // default: 15 minutes (900000 ms)
  intervalMs?: number; // default: 5 minutes (300000 ms)
}

export class TempCleanupManager {
  private tempDir: string;
  private ttlMs: number;
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: CleanupOptions) {
    this.tempDir = options.tempDir;
    this.ttlMs = options.ttlMs ?? 15 * 60 * 1000; // 15 minutes
    this.intervalMs = options.intervalMs ?? 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Scans the temporary folder and removes any files older than the TTL limit
   */
  async runCleanup(): Promise<{ deletedCount: number; reclaimedBytes: number }> {
    let deletedCount = 0;
    let reclaimedBytes = 0;
    const now = Date.now();

    try {
      const files = await fsp.readdir(this.tempDir);
      for (const file of files) {
        const fullPath = path.join(this.tempDir, file);
        try {
          const stats = await fsp.stat(fullPath);
          if (stats.isFile()) {
            const ageMs = now - stats.mtimeMs;
            if (ageMs > this.ttlMs) {
              reclaimedBytes += stats.size;
              await fsp.unlink(fullPath);
              deletedCount++;
            }
          }
        } catch {
          // File might have been removed concurrently, ignore
        }
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        // Temp directory doesn't exist yet, nothing to clean
      }
    }

    return { deletedCount, reclaimedBytes };
  }

  start(): void {
    this.stop();
    this.timer = setInterval(() => {
      this.runCleanup().catch(() => {});
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
