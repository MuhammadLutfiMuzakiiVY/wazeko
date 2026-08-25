import { Jid, Message, MessageContent } from "../../../wazeko-types/src/index.js";

export type MessagePriority = "HIGH" | "NORMAL" | "LOW";

export interface MessageJobOptions {
  priority?: MessagePriority;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  customId?: string;
}

export interface MessageJob {
  id: string;
  to: Jid | string;
  content: MessageContent;
  priority: MessagePriority;
  maxRetries: number;
  retryCount: number;
  retryDelayMs: number;
  timeoutMs: number;
  createdAt: number;
  status: "pending" | "processing" | "completed" | "failed";
  resolve: (value: Message) => void;
  reject: (reason?: any) => void;
}

export interface RateLimiterOptions {
  minJitterMs?: number; // default: 1500 (1.5s)
  maxJitterMs?: number; // default: 4000 (4.0s)
  maxMessagesPerWindow?: number; // default: 30
  windowMs?: number; // default: 60000 (1 minute)
}

export interface QueueStats {
  pendingCount: number;
  highPriorityCount: number;
  normalPriorityCount: number;
  lowPriorityCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
}
