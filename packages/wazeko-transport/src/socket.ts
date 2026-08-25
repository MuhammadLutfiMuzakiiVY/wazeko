export interface Socket {
  connect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
  on(event: "open" | "close" | "error" | "message", listener: (...args: any[]) => void): this;
}
