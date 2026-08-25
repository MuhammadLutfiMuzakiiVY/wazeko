import { EventEmitter } from "events";
import WebSocket from "ws";
import { Socket } from "./socket.js";
import { ConnectionError } from "../../wazeko-core/src/index.js";

export const DEFAULT_WA_WEB_WS_URL = "wss://web.whatsapp.com/ws/chat";

export class WebSocketTransport extends EventEmitter implements Socket {
  private ws: WebSocket | null = null;
  private url: string;
  private _isConnected: boolean = false;
  private timeoutMs: number;

  constructor(url: string = DEFAULT_WA_WEB_WS_URL, timeoutMs: number = 30000) {
    super();
    this.url = url;
    this.timeoutMs = timeoutMs;
  }

  isConnected(): boolean {
    return this._isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, {
          origin: "https://web.whatsapp.com",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          handshakeTimeout: this.timeoutMs,
        });

        let settled = false;

        this.ws.on("open", () => {
          this._isConnected = true;
          this.emit("open");
          if (!settled) {
            settled = true;
            resolve();
          }
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          let buffer: Uint8Array;
          if (Buffer.isBuffer(data)) {
            buffer = new Uint8Array(data);
          } else if (data instanceof ArrayBuffer) {
            buffer = new Uint8Array(data);
          } else {
            buffer = new TextEncoder().encode(data.toString());
          }
          this.emit("message", buffer);
        });

        this.ws.on("close", (code: number, reason: Buffer) => {
          this._isConnected = false;
          this.emit("close", code, reason.toString());
          if (!settled) {
            settled = true;
            reject(new ConnectionError(`WebSocket closed before connected (code: ${code})`));
          }
        });

        this.ws.on("error", (err: Error) => {
          this.emit("error", err);
          if (!settled) {
            settled = true;
            reject(new ConnectionError(`WebSocket connection error: ${err.message}`, err));
          }
        });
      } catch (err: any) {
        reject(new ConnectionError(`Failed to initialize WebSocket: ${err.message}`, err));
      }
    });
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.ws) {
      throw new ConnectionError("Cannot send data: WebSocket is not connected");
    }

    return new Promise<void>((resolve, reject) => {
      this.ws!.send(data, (err) => {
        if (err) {
          reject(new ConnectionError(`Failed to send packet: ${err.message}`, err));
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
  }
}
