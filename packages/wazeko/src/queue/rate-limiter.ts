import { RateLimiterOptions } from "./types.js";

export class AntiBanRateLimiter {
  private minJitterMs: number;
  private maxJitterMs: number;
  private maxMessagesPerWindow: number;
  private windowMs: number;
  private timestamps: number[] = [];

  constructor(options: RateLimiterOptions = {}) {
    this.minJitterMs = options.minJitterMs ?? 1500;
    this.maxJitterMs = options.maxJitterMs ?? 4000;
    this.maxMessagesPerWindow = options.maxMessagesPerWindow ?? 30;
    this.windowMs = options.windowMs ?? 60000;
  }

  /**
   * Generates a random jitter delay between minJitterMs and maxJitterMs to mimic human typing / delay
   */
  getRandomJitter(): number {
    return Math.floor(Math.random() * (this.maxJitterMs - this.minJitterMs + 1)) + this.minJitterMs;
  }

  /**
   * Checks if sending is currently permitted within the sliding window, or calculates wait time
   */
  getQuotaWaitTime(): number {
    const now = Date.now();
    // Prune expired timestamps
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

    if (this.timestamps.length >= this.maxMessagesPerWindow) {
      const oldest = this.timestamps[0];
      return Math.max(0, this.windowMs - (now - oldest));
    }
    return 0;
  }

  /**
   * Waits for both sliding window quota clearance and human jitter before returning
   */
  async acquire(isHighPriority: boolean = false): Promise<number> {
    const quotaWait = this.getQuotaWaitTime();
    if (quotaWait > 0) {
      await new Promise((resolve) => setTimeout(resolve, quotaWait));
    }

    // High priority gets minimal latency (e.g. 50-200ms) for urgent OTP/alerts, normal/low gets full jitter
    const jitter = isHighPriority ? Math.floor(Math.random() * 150) + 50 : this.getRandomJitter();
    if (jitter > 0) {
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }

    this.timestamps.push(Date.now());
    return jitter;
  }

  /**
   * Resets rate limiter tracking state
   */
  reset(): void {
    this.timestamps = [];
  }
}
