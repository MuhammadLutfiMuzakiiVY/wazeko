import test from "node:test";
import assert from "node:assert/strict";
import { encryptMedia, decryptMedia, deriveMediaKeys } from "../packages/wazeko-core/src/media.js";

test("Media Crypto: Keys derivation per media type (image, video, audio, doc)", () => {
  const mediaKey = new Uint8Array(32).fill(42);
  const imageKeys = deriveMediaKeys(mediaKey, "image");
  const videoKeys = deriveMediaKeys(mediaKey, "video");

  assert.equal(imageKeys.iv.length, 16);
  assert.equal(imageKeys.cipherKey.length, 32);
  assert.equal(imageKeys.macKey.length, 32);

  // Different media types should yield different sub-keys
  assert.notDeepEqual(imageKeys.cipherKey, videoKeys.cipherKey);
});

test("Media Crypto: Encrypt & Decrypt roundtrip", () => {
  const rawImage = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const encrypted = encryptMedia(rawImage, "image");

  assert.equal(encrypted.mediaKey.length, 32);
  assert.equal(encrypted.fileSha256.length, 32);
  assert.ok(encrypted.encryptedPayload.length > rawImage.length);

  const decrypted = decryptMedia(encrypted.encryptedPayload, encrypted.mediaKey, "image");
  assert.deepEqual(decrypted, rawImage);
});

test("Media Crypto: HMAC tamper detection and rejection", () => {
  const rawData = new TextEncoder().encode("Important Document Text");
  const encrypted = encryptMedia(rawData, "document");

  // Tamper with one byte in the payload
  const tamperedPayload = new Uint8Array(encrypted.encryptedPayload);
  tamperedPayload[0] ^= 0xff;

  assert.throws(
    () => decryptMedia(tamperedPayload, encrypted.mediaKey, "document"),
    { message: /Media HMAC verification failed/ }
  );
});
