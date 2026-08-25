import {
  randomBytes,
  sha256,
  hmacSha256,
  hkdf,
  aesCbcEncrypt,
  aesCbcDecrypt,
} from "./crypto.js";
import { WazekoError } from "./errors.js";

export type MediaType = "image" | "video" | "audio" | "document" | "sticker";

export interface MediaKeys {
  iv: Uint8Array;
  cipherKey: Uint8Array;
  macKey: Uint8Array;
  refKey: Uint8Array;
}

export interface EncryptedMediaResult {
  mediaKey: Uint8Array;
  encryptedPayload: Uint8Array;
  fileSha256: Uint8Array;
  fileEncSha256: Uint8Array;
}

const MEDIA_APP_INFO: Record<MediaType, string> = {
  image: "WhatsApp Image Keys",
  video: "WhatsApp Video Keys",
  audio: "WhatsApp Audio Keys",
  document: "WhatsApp Document Keys",
  sticker: "WhatsApp Image Keys",
};

export function deriveMediaKeys(mediaKey: Uint8Array, mediaType: MediaType): MediaKeys {
  const appInfo = MEDIA_APP_INFO[mediaType] ?? "WhatsApp Image Keys";
  const expanded = hkdf(mediaKey, 112, new Uint8Array(32), appInfo);

  return {
    iv: expanded.subarray(0, 16),
    cipherKey: expanded.subarray(16, 48),
    macKey: expanded.subarray(48, 80),
    refKey: expanded.subarray(80, 112),
  };
}

export function encryptMedia(plaintext: Uint8Array, mediaType: MediaType): EncryptedMediaResult {
  const mediaKey = randomBytes(32);
  const keys = deriveMediaKeys(mediaKey, mediaType);

  const fileSha256 = sha256(plaintext);
  const encrypted = aesCbcEncrypt(keys.cipherKey, keys.iv, plaintext);

  // Truncated 10-byte MAC
  const macInput = new Uint8Array(keys.iv.length + encrypted.length);
  macInput.set(keys.iv);
  macInput.set(encrypted, keys.iv.length);

  const fullMac = hmacSha256(keys.macKey, macInput);
  const truncatedMac = fullMac.subarray(0, 10);

  const encryptedPayload = new Uint8Array(encrypted.length + truncatedMac.length);
  encryptedPayload.set(encrypted);
  encryptedPayload.set(truncatedMac, encrypted.length);

  const fileEncSha256 = sha256(encryptedPayload);

  return {
    mediaKey,
    encryptedPayload,
    fileSha256,
    fileEncSha256,
  };
}

export function decryptMedia(
  encryptedPayload: Uint8Array,
  mediaKey: Uint8Array,
  mediaType: MediaType
): Uint8Array {
  if (encryptedPayload.length < 10) {
    throw new WazekoError("MEDIA", "Encrypted media payload is too short");
  }

  const keys = deriveMediaKeys(mediaKey, mediaType);
  const ciphertext = encryptedPayload.subarray(0, encryptedPayload.length - 10);
  const receivedMac = encryptedPayload.subarray(encryptedPayload.length - 10);

  // Validate MAC
  const macInput = new Uint8Array(keys.iv.length + ciphertext.length);
  macInput.set(keys.iv);
  macInput.set(ciphertext, keys.iv.length);

  const fullMac = hmacSha256(keys.macKey, macInput);
  const expectedMac = fullMac.subarray(0, 10);

  for (let i = 0; i < 10; i++) {
    if (receivedMac[i] !== expectedMac[i]) {
      throw new WazekoError("MEDIA", "Media HMAC verification failed: media is corrupted or tampered");
    }
  }

  return aesCbcDecrypt(keys.cipherKey, keys.iv, ciphertext);
}
