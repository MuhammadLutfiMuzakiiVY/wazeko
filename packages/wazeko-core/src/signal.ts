import { generateKeyPair, KeyPair, randomBytes, sha256, hmacSha256, hkdf, aesCbcEncrypt, aesCbcDecrypt } from "./crypto.js";
import { Jid, jidToString } from "../../wazeko-types/src/index.js";
import { SignedPreKey } from "./session.js";

export interface PreKey {
  keyId: number;
  keyPair: KeyPair;
}

export interface PreKeyBundle {
  registrationId: number;
  identityKey: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  preKey?: {
    keyId: number;
    publicKey: Uint8Array;
  };
}

export class PreKeyManager {
  private preKeys: Map<number, KeyPair> = new Map();
  private signedPreKeys: Map<number, SignedPreKey> = new Map();
  private currentSignedPreKeyId: number = 1;

  generateInitialPreKeys(count: number = 30): PreKey[] {
    const list: PreKey[] = [];
    for (let i = 1; i <= count; i++) {
      const kp = generateKeyPair();
      this.preKeys.set(i, kp);
      list.push({ keyId: i, keyPair: kp });
    }
    return list;
  }

  generateSignedPreKey(identityKeyPair: KeyPair): SignedPreKey {
    const keyId = this.currentSignedPreKeyId++;
    const keyPair = generateKeyPair();
    // Deterministic signature simulation
    const signature = hmacSha256(identityKeyPair.privateKey, keyPair.publicKey);

    const signedPreKey: SignedPreKey = {
      keyId,
      keyPair,
      signature,
    };
    this.signedPreKeys.set(keyId, signedPreKey);
    return signedPreKey;
  }

  rotateSignedPreKey(identityKeyPair: KeyPair): SignedPreKey {
    return this.generateSignedPreKey(identityKeyPair);
  }

  getPreKey(keyId: number): KeyPair | undefined {
    return this.preKeys.get(keyId);
  }

  getSignedPreKey(keyId: number): SignedPreKey | undefined {
    return this.signedPreKeys.get(keyId);
  }
}

export interface SignalEncryptedMessage {
  type: "msg" | "pkmsg";
  registrationId: number;
  ciphertext: Uint8Array;
}

export class SignalSession {
  private sharedSecret: Uint8Array;
  private rootKey: Uint8Array;
  private chainKey: Uint8Array;
  private sequence: number = 0;

  constructor(sharedSecret: Uint8Array) {
    this.sharedSecret = sharedSecret;
    this.rootKey = hkdf(sharedSecret, 32, new Uint8Array(32), "Signal-Root");
    this.chainKey = hkdf(this.rootKey, 32, new Uint8Array(32), "Signal-Chain");
  }

  encrypt(plaintext: Uint8Array): SignalEncryptedMessage {
    const messageKey = hkdf(this.chainKey, 32, new Uint8Array(32), `Signal-Msg-${this.sequence}`);
    const iv = randomBytes(16);
    const ciphertext = aesCbcEncrypt(messageKey, iv, plaintext);

    const packed = new Uint8Array(iv.length + ciphertext.length);
    packed.set(iv);
    packed.set(ciphertext, iv.length);

    this.sequence++;
    // Advance chain key
    this.chainKey = sha256(this.chainKey);

    return {
      type: this.sequence === 1 ? "pkmsg" : "msg",
      registrationId: 1000,
      ciphertext: packed,
    };
  }

  decrypt(message: SignalEncryptedMessage): Uint8Array {
    const iv = message.ciphertext.subarray(0, 16);
    const ciphertext = message.ciphertext.subarray(16);

    const messageKey = hkdf(this.chainKey, 32, new Uint8Array(32), `Signal-Msg-${this.sequence}`);
    const plaintext = aesCbcDecrypt(messageKey, iv, ciphertext);

    this.sequence++;
    this.chainKey = sha256(this.chainKey);

    return plaintext;
  }
}

export class SignalSessionStore {
  private sessions: Map<string, SignalSession> = new Map();

  getOrCreateSession(remoteJid: Jid | string, sharedSecret?: Uint8Array): SignalSession {
    const key = typeof remoteJid === "string" ? remoteJid : jidToString(remoteJid);
    let session = this.sessions.get(key);
    if (!session) {
      const secret = sharedSecret ?? randomBytes(32);
      session = new SignalSession(secret);
      this.sessions.set(key, session);
    }
    return session;
  }
}
