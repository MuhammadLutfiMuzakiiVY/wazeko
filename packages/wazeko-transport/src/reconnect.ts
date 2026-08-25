export interface BackoffConfig {
  initialIntervalMs: number;
  maxIntervalMs: number;
  multiplier: number;
  maxRetries?: number;
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialIntervalMs: 1000,
  maxIntervalMs: 30000,
  multiplier: 1.5,
};

export class ReconnectManager {
  private config: BackoffConfig;
  private currentAttempt: number = 0;
  private currentIntervalMs: number;

  constructor(config: BackoffConfig = DEFAULT_BACKOFF_CONFIG) {
    this.config = config;
    this.currentIntervalMs = config.initialIntervalMs;
  }

  reset(): void {
    this.currentAttempt = 0;
    this.currentIntervalMs = this.config.initialIntervalMs;
  }

  shouldRetry(): boolean {
    if (this.config.maxRetries !== undefined) {
      return this.currentAttempt < this.config.maxRetries;
    }
    return true;
  }

  nextDelayMs(): number | null {
    if (!this.shouldRetry()) {
      return null;
    }

    this.currentAttempt++;
    const delay = this.currentIntervalMs;
    this.currentIntervalMs = Math.min(
      this.currentIntervalMs * this.config.multiplier,
      this.config.maxIntervalMs
    );

    return delay;
  }

  get attempt(): number {
    return this.currentAttempt;
  }
}
