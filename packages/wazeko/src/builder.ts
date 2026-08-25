import { AuthMethod, AuthStore } from "../../wazeko-auth/src/index.js";
import { DeviceIdentity } from "../../wazeko-core/src/index.js";
import { ClientConfig, defaultClientConfig } from "./config.js";
import { Wazeko } from "./client.js";

export class WazekoBuilder {
  private config: ClientConfig = defaultClientConfig();
  private customStore?: AuthStore;

  authStore(path: string): this {
    this.config.authStorePath = path;
    return this;
  }

  customAuthStore(store: AuthStore): this {
    this.customStore = store;
    return this;
  }

  authMethod(method: AuthMethod): this {
    this.config.authMethod = method;
    return this;
  }

  pairingPhoneNumber(phone: string): this {
    this.config.pairingPhoneNumber = phone;
    this.config.authMethod = "pairing-code";
    return this;
  }

  wsUrl(url: string): this {
    this.config.wsUrl = url;
    return this;
  }

  autoReconnect(enable: boolean): this {
    this.config.autoReconnect = enable;
    return this;
  }

  printQr(enable: boolean): this {
    this.config.printQr = enable;
    return this;
  }

  connectTimeout(ms: number): this {
    this.config.connectTimeoutMs = ms;
    return this;
  }

  device(device: DeviceIdentity): this {
    this.config.device = device;
    return this;
  }

  build(): Wazeko {
    return new Wazeko(this.config, this.customStore);
  }
}
