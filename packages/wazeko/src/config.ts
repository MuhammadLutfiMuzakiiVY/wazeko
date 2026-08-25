import { AuthMethod } from "../../wazeko-auth/src/index.js";
import { defaultDeviceIdentity, DeviceIdentity } from "../../wazeko-core/src/index.js";
import { DEFAULT_WA_WEB_WS_URL } from "../../wazeko-transport/src/index.js";

export interface ClientConfig {
  wsUrl: string;
  authStorePath?: string;
  authMethod: AuthMethod;
  pairingPhoneNumber?: string;
  connectTimeoutMs: number;
  autoReconnect: boolean;
  printQr: boolean;
  device: DeviceIdentity;
}

export function defaultClientConfig(): ClientConfig {
  return {
    wsUrl: DEFAULT_WA_WEB_WS_URL,
    authMethod: "qr",
    connectTimeoutMs: 30000,
    autoReconnect: true,
    printQr: true,
    device: defaultDeviceIdentity(),
  };
}
