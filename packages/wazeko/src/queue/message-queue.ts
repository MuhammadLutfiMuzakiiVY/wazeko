import { EventEmitter } from "events";
import { Jid, Message, MessageContent } from "../../../wazeko-types/src/index.js";
import { MessageJob, MessageJobOptions, QueueStats } from "./types.js";
import { AntiBanRateLimiter } from "./rate-limiter.js";

export interface MessageSender {
  sendMessage(to: Jid | string, content: MessageContent): Promise<Message>;
}

export interface MessageQueueOptions {
  concurrency?: number;
  rateLimiter?: AntiBanRateLimiter;
  autoStart?: boolean;
}

export class MessageQueue extends EventEmitter {
  private sender: MessageSender;
  private highQueue: MessageJob[] = [];
  private normalQueue: MessageJob[] = [];
  private lowQueue: MessageJob[] = [];

  private runningWorkers: number = 0;
  private maxConcurrency: number;
  private isProcessing: boolean = false;
  private rateLimiter: AntiBanRateLimiter;

  private completedCount: number = 0;
  private failedCount: number = 0;
  private processingCount: number = 0;

  constructor(sender: MessageSender, options: MessageQueueOptions = {}) {
    super();
    this.sender = sender;
    this.maxConcurrency = options.concurrency ?? 1; // Default serial dispatch to protect WhatsApp account
    this.rateLimiter = options.rateLimiter ?? new AntiBanRateLimiter();

    if (options.autoStart !== false) {
      this.isProcessing = true;
    }
  }

  /**
   * Enqueues a message with priority routing
   */
  async enqueue(to: Jid | string, content: MessageContent, options: MessageJobOptions = {}): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      const priority = options.priority ?? "NORMAL";
      const job: MessageJob = {
        id: options.customId ?? `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        to,
        content,
        priority,
        maxRetries: options.maxRetries ?? 3,
        retryCount: 0,
        retryDelayMs: options.retryDelayMs ?? 1000,
        timeoutMs: options.timeoutMs ?? 30000,
        createdAt: Date.now(),
        status: "pending",
        resolve,
        reject,
      };

      if (priority === "HIGH") {
        this.highQueue.push(job);
      } else if (priority === "LOW") {
        this.lowQueue.push(job);
      } else {
        this.normalQueue.push(job);
      }

      this.emit("job:enqueued", job);
      this.triggerProcessing();
    });
  }

  private getNextJob(): MessageJob | null {
    if (this.highQueue.length > 0) return this.highQueue.shift()!;
    if (this.normalQueue.length > 0) return this.normalQueue.shift()!;
    if (this.lowQueue.length > 0) return this.lowQueue.shift()!;
    return null;
  }

  private triggerProcessing(): void {
    if (!this.isProcessing) return;

    while (this.runningWorkers < this.maxConcurrency) {
      const job = this.getNextJob();
      if (!job) break;
      this.runningWorkers++;
      this.processingCount++;
      this.processJob(job).finally(() => {
        this.runningWorkers--;
        this.processingCount--;
        this.triggerProcessing();
      });
    }
  }

  private async processJob(job: MessageJob): Promise<void> {
    job.status = "processing";
    this.emit("job:processing", job);

    try {
      // 1. Acquire rate limit clearance (with human jitter)
      await this.rateLimiter.acquire(job.priority === "HIGH");

      // 2. Dispatch message
      const result = await this.sender.sendMessage(job.to, job.content);

      job.status = "completed";
      this.completedCount++;
      this.emit("job:completed", { job, result });
      job.resolve(result);
    } catch (err: any) {
      job.retryCount++;
      if (job.retryCount <= job.maxRetries) {
        this.emit("job:retry", { job, error: err, attempt: job.retryCount });
        // Exponential backoff before re-enqueuing
        const delay = job.retryDelayMs * Math.pow(2, job.retryCount - 1);
        await new Promise((r) => setTimeout(r, delay));

        // Re-enqueue at the front of its priority queue
        if (job.priority === "HIGH") {
          this.highQueue.unshift(job);
        } else if (job.priority === "LOW") {
          this.lowQueue.unshift(job);
        } else {
          this.normalQueue.unshift(job);
        }
      } else {
        job.status = "failed";
        this.failedCount++;
        this.emit("job:failed", { job, error: err });
        job.reject(err);
      }
    }
  }

  getStats(): QueueStats {
    return {
      pendingCount: this.highQueue.length + this.normalQueue.length + this.lowQueue.length,
      highPriorityCount: this.highQueue.length,
      normalPriorityCount: this.normalQueue.length,
      lowPriorityCount: this.lowQueue.length,
      processingCount: this.processingCount,
      completedCount: this.completedCount,
      failedCount: this.failedCount,
    };
  }

  start(): void {
    this.isProcessing = true;
    this.triggerProcessing();
  }

  pause(): void {
    this.isProcessing = false;
  }

  clear(): void {
    this.highQueue = [];
    this.normalQueue = [];
    this.lowQueue = [];
  }
}
