import { Jid } from "../../wazeko-types/src/index.js";

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SignedPreKey {
  keyId: number;
  keyPair: KeyPair;
  signature: Uint8Array;
}

export interface Credentials {
  me?: Jid;
  clientId: string;
  clientToken?: string;
  serverToken?: string;
  encKey?: Uint8Array;
  macKey?: Uint8Array;
  noiseKey?: KeyPair;
  identityKey?: KeyPair;
  signedPreKey?: SignedPreKey;
  registrationId: number;
  registered: boolean;
}

export function initCredentials(): Credentials {
  return {
    clientId: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64"),
    registrationId: Math.floor(Math.random() * 65535),
    registered: false,
  };
}
