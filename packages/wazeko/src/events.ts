import { EventEmitter } from "events";
import { WazekoEventMap, WazekoEventName } from "../../wazeko-types/src/index.js";

export interface TypedEventEmitter {
  on<E extends WazekoEventName>(event: E, listener: (data: WazekoEventMap[E]) => void): this;
  once<E extends WazekoEventName>(event: E, listener: (data: WazekoEventMap[E]) => void): this;
  emit<E extends WazekoEventName>(event: E, data: WazekoEventMap[E]): boolean;
  off<E extends WazekoEventName>(event: E, listener: (data: WazekoEventMap[E]) => void): this;
}

export class AsyncEventQueue {
  private queue: Array<{ name: WazekoEventName; data: any }> = [];
  private waiters: Array<(item: { name: WazekoEventName; data: any }) => void> = [];
  private closed: boolean = false;

  push(name: WazekoEventName, data: any): void {
    if (this.closed) return;
    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter({ name, data });
    } else {
      this.queue.push({ name, data });
    }
  }

  async next(): Promise<{ name: WazekoEventName; data: any } | null> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    if (this.closed) {
      return null;
    }
    return new Promise((resolve) => {
      this.waiters.push((item) => resolve(item));
    });
  }

  close(): void {
    this.closed = true;
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter({ name: "disconnect", data: { reason: "queue closed" } });
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<{ name: WazekoEventName; data: any }> {
    while (!this.closed) {
      const item = await this.next();
      if (item === null) break;
      yield item;
    }
  }
}
