import {
  generateKeyPair,
  KeyPair,
  hkdf,
  sha256,
  aesGcmEncrypt,
  aesGcmDecrypt,
} from "./crypto.js";
import { AuthenticationError } from "./errors.js";

export interface CipherState {
  encKey: Uint8Array;
  decKey: Uint8Array;
  encCounter: bigint;
  decCounter: bigint;
}

export class NoiseHandshake {
  private ephemeralKeyPair: KeyPair;
  private staticKeyPair: KeyPair;
  private hash: Uint8Array;
  private chainingKey: Uint8Array;
  private isComplete: boolean = false;
  private cipherState: CipherState | null = null;

  constructor(staticKeyPair?: KeyPair) {
    this.staticKeyPair = staticKeyPair ?? generateKeyPair();
    this.ephemeralKeyPair = generateKeyPair();

    const protocolName = new TextEncoder().encode("Noise_XX_25519_AESGCM_SHA256\0\0\0\0");
    this.hash = sha256(protocolName);
    this.chainingKey = new Uint8Array(this.hash);
  }

  get clientEphemeralPublic(): Uint8Array {
    return this.ephemeralKeyPair.publicKey;
  }

  initiateHandshake(): Uint8Array {
    this.mixHash(this.ephemeralKeyPair.publicKey);
    return this.ephemeralKeyPair.publicKey;
  }

  processServerHello(serverEphemeralPublic: Uint8Array, serverPayloadEnc: Uint8Array): Uint8Array {
    if (serverEphemeralPublic.length !== 32) {
      throw new AuthenticationError("Invalid server ephemeral public key length");
    }

    this.mixHash(serverEphemeralPublic);

    const sharedKey = hkdf(serverEphemeralPublic, 64, this.chainingKey, "Noise-DH");
    this.chainingKey = sharedKey.subarray(0, 32);
    const tempKey = sharedKey.subarray(32, 64);

    if (serverPayloadEnc.length < 16) {
      throw new AuthenticationError("Server payload too short for AEAD tag");
    }
    const tag = serverPayloadEnc.subarray(serverPayloadEnc.length - 16);
    const ciphertext = serverPayloadEnc.subarray(0, serverPayloadEnc.length - 16);

    const iv = this.counterToIv(0n);
    const decrypted = aesGcmDecrypt(tempKey, iv, ciphertext, tag);
    this.mixHash(serverPayloadEnc);

    return decrypted;
  }

  finalizeHandshake(clientPayload: Uint8Array = new Uint8Array(0)): {
    clientFinish: Uint8Array;
    cipherState: CipherState;
  } {
    const sharedSecret = hkdf(this.staticKeyPair.publicKey, 64, this.chainingKey, "Noise-Final");
    const writeKey = sharedSecret.subarray(0, 32);
    const readKey = sharedSecret.subarray(32, 64);

    const iv = this.counterToIv(0n);
    const { ciphertext, tag } = aesGcmEncrypt(writeKey, iv, clientPayload);

    const clientFinish = new Uint8Array(ciphertext.length + tag.length);
    clientFinish.set(ciphertext);
    clientFinish.set(tag, ciphertext.length);

    this.cipherState = {
      encKey: writeKey,
      decKey: readKey,
      encCounter: 0n,
      decCounter: 0n,
    };
    this.isComplete = true;

    return {
      clientFinish,
      cipherState: this.cipherState,
    };
  }

  // Server-side helper to craft server hello in tests
  craftServerHello(serverPayload: Uint8Array): { serverEphemeral: Uint8Array; serverPayloadEnc: Uint8Array } {
    this.mixHash(this.ephemeralKeyPair.publicKey);
    const sharedKey = hkdf(this.ephemeralKeyPair.publicKey, 64, this.chainingKey, "Noise-DH");
    this.chainingKey = sharedKey.subarray(0, 32);
    const tempKey = sharedKey.subarray(32, 64);

    const iv = this.counterToIv(0n);
    const { ciphertext, tag } = aesGcmEncrypt(tempKey, iv, serverPayload);

    const serverPayloadEnc = new Uint8Array(ciphertext.length + tag.length);
    serverPayloadEnc.set(ciphertext);
    serverPayloadEnc.set(tag, ciphertext.length);

    this.mixHash(serverPayloadEnc);

    return {
      serverEphemeral: this.ephemeralKeyPair.publicKey,
      serverPayloadEnc,
    };
  }

  private mixHash(data: Uint8Array): void {
    const combined = new Uint8Array(this.hash.length + data.length);
    combined.set(this.hash);
    combined.set(data, this.hash.length);
    this.hash = sha256(combined);
  }

  private counterToIv(counter: bigint): Uint8Array {
    const iv = new Uint8Array(12);
    const view = new DataView(iv.buffer);
    view.setBigUint64(4, counter, false);
    return iv;
  }

  get completed(): boolean {
    return this.isComplete;
  }

  get state(): CipherState | null {
    return this.cipherState;
  }
}

export class FrameCipher {
  constructor(private cipherState: CipherState) {}

  encryptFrame(plaintext: Uint8Array): Uint8Array {
    const iv = new Uint8Array(12);
    new DataView(iv.buffer).setBigUint64(4, this.cipherState.encCounter++, false);

    const { ciphertext, tag } = aesGcmEncrypt(this.cipherState.encKey, iv, plaintext);
    const length = ciphertext.length + tag.length;

    // Frame header: 3 bytes big-endian length
    const frame = new Uint8Array(3 + length);
    frame[0] = (length >> 16) & 0xff;
    frame[1] = (length >> 8) & 0xff;
    frame[2] = length & 0xff;
    frame.set(ciphertext, 3);
    frame.set(tag, 3 + ciphertext.length);

    return frame;
  }

  decryptFrame(frame: Uint8Array): Uint8Array {
    if (frame.length < 3 + 16) {
      throw new AuthenticationError("Encrypted frame is too short");
    }

    const payload = frame.subarray(3);
    const tag = payload.subarray(payload.length - 16);
    const ciphertext = payload.subarray(0, payload.length - 16);

    const iv = new Uint8Array(12);
    new DataView(iv.buffer).setBigUint64(4, this.cipherState.decCounter++, false);

    return aesGcmDecrypt(this.cipherState.decKey, iv, ciphertext, tag);
  }
}
