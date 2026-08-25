import { EventEmitter } from "events";
import { ConnectionState, Jid, Message, MessageContent, WazekoEventMap, WazekoEventName } from "../../wazeko-types/src/index.js";
import { ProtocolNode, BinaryEncoder } from "../../wazeko-protocol/src/index.js";
import { Credentials, initCredentials, randomBytes } from "../../wazeko-core/src/index.js";
import { AuthStore, AtomicFileAuthStore, MemoryAuthStore, PairingCodeManager, QrCodeManager } from "../../wazeko-auth/src/index.js";
import { ReconnectManager } from "../../wazeko-transport/src/index.js";
import { ClientConfig } from "./config.js";
import { WazekoBuilder } from "./builder.js";
import { AsyncEventQueue } from "./events.js";
import { Messaging } from "./messaging.js";
import { Groups } from "./groups.js";
import { MessageQueue } from "./queue/message-queue.js";
import { MessageJobOptions } from "./queue/types.js";
import { CommandRegistry } from "./plugins/command-loader.js";
import { StructuredLogger } from "./observability/logger.js";
import { MonitoringServer } from "./observability/monitoring-server.js";

export interface WazekoClientInternal {
  getMe(): Jid | undefined;
  dispatchNode(node: ProtocolNode, message?: Message): Promise<void>;
}

export class Wazeko extends EventEmitter implements WazekoClientInternal {
  private config: ClientConfig;
  private authStore: AuthStore;
  private credentials: Credentials;
  private state: ConnectionState = "disconnected";
  private eventQueue: AsyncEventQueue = new AsyncEventQueue();
  private encoder: BinaryEncoder = new BinaryEncoder();
  private qrManager: QrCodeManager = new QrCodeManager();
  private pairingManager: PairingCodeManager = new PairingCodeManager();
  private reconnectManager: ReconnectManager = new ReconnectManager();

  public readonly messaging: Messaging;
  public readonly groups: Groups;
  public readonly queue: MessageQueue;
  public readonly plugins: CommandRegistry;
  public readonly logger: StructuredLogger;
  public readonly monitor: MonitoringServer;

  static builder(): WazekoBuilder {
    return new WazekoBuilder();
  }

  constructor(config: ClientConfig, customStore?: AuthStore) {
    super();
    this.config = config;
    if (customStore) {
      this.authStore = customStore;
    } else if (config.authStorePath) {
      this.authStore = new AtomicFileAuthStore(config.authStorePath);
    } else {
      this.authStore = new MemoryAuthStore();
    }
    this.credentials = initCredentials();
    this.messaging = new Messaging(this);
    this.groups = new Groups(this);

    this.logger = new StructuredLogger({ service: "wazeko-client" });
    this.queue = new MessageQueue({
      sendMessage: (to, content) => this.messaging.sendMessage(to, content),
    });
    this.plugins = new CommandRegistry();
    this.monitor = new MonitoringServer({
      client: this,
      queue: this.queue,
      registry: this.plugins,
      qrCodeSupplier: () => this.qrManager.current?.raw ?? null,
    });

    // Wire up incoming message dispatch to dynamic plugin loader
    this.on("message", (msg: Message) => {
      this.plugins.handleMessage(this, msg).catch((err) => {
        this.logger.error("Plugin handler execution failed", err);
      });
    });
  }

  getMe(): Jid | undefined {
    return this.credentials.me;
  }

  getConnectionState(): ConnectionState {
    return this.state;
  }

  events(): AsyncEventQueue {
    return this.eventQueue;
  }

  private setState(newState: ConnectionState): void {
    this.state = newState;
    this.emitEvent("connection.update", newState);
  }

  private emitEvent<E extends WazekoEventName>(event: E, data: WazekoEventMap[E]): void {
    this.emit(event, data);
    this.eventQueue.push(event, data);
  }

  async connect(): Promise<void> {
    this.setState("connecting");

    const savedCreds = await this.authStore.load();
    if (savedCreds) {
      this.credentials = savedCreds;
    }

    // Run async connection / lifecycle simulator
    this.runConnectionLifecycle();
  }

  private async runConnectionLifecycle(): Promise<void> {
    if (this.credentials.registered) {
      this.setState("connected");
      if (this.credentials.me) {
        this.emitEvent("authenticated", { userJid: this.credentials.me });
      }
    } else {
      this.setState("authenticating");

      if (this.config.authMethod === "qr") {
        const randomChallenge = `2@${Buffer.from(randomBytes(16)).toString("base64")},${Buffer.from(randomBytes(32)).toString("base64")},${Buffer.from(randomBytes(16)).toString("base64")}`;
        const qrEvent = this.qrManager.updateQr(randomChallenge, this.reconnectManager.attempt + 1, 60);
        this.emitEvent("qr", qrEvent);

        if (this.config.printQr) {
          this.qrManager.printTerminal(true);
        }
      } else if (this.config.authMethod === "pairing-code") {
        const pairingEvent = this.pairingManager.generateCode(120);
        this.emitEvent("pairing.code", pairingEvent);
        this.pairingManager.printCode();
      }
    }
  }

  async disconnect(reason: string = "User initiated disconnect"): Promise<void> {
    this.setState("disconnected");
    this.emitEvent("disconnect", { reason });
    this.eventQueue.close();
    await this.monitor.stop();
  }

  async dispatchNode(node: ProtocolNode, message?: Message): Promise<void> {
    const _encoded = this.encoder.encode(node);
    if (message) {
      this.emitEvent("message", message);
    }
  }

  /**
   * Sends a message directly (un-queued)
   */
  async sendMessage(to: Jid | string, content: MessageContent): Promise<Message> {
    return this.messaging.sendMessage(to, content);
  }

  /**
   * Enqueues message through the priority rate-limited queue worker (Anti-Ban protected)
   */
  async enqueueMessage(to: Jid | string, content: MessageContent, options?: MessageJobOptions): Promise<Message> {
    return this.queue.enqueue(to, content, options);
  }

  async sendImage(
    to: Jid | string,
    image: Uint8Array | Buffer | { url: string },
    options?: { caption?: string; mimetype?: string }
  ): Promise<Message> {
    return this.messaging.sendImage(to, image, options);
  }

  async reply(original: Message, text: string): Promise<Message> {
    return this.messaging.reply(original, text);
  }
}
