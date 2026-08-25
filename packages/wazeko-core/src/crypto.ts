import * as crypto from "crypto";

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519", {
    publicKeyEncoding: { format: "der", type: "spki" },
    privateKeyEncoding: { format: "der", type: "pkcs8" },
  });

  // Extract raw 32-byte keys from DER (standard SPKI has 12-byte header, PKCS8 has 16-byte header)
  const rawPublic = new Uint8Array(publicKey.subarray(publicKey.length - 32));
  const rawPrivate = new Uint8Array(privateKey.subarray(privateKey.length - 32));

  return {
    publicKey: rawPublic,
    privateKey: rawPrivate,
  };
}

export function randomBytes(length: number): Uint8Array {
  return new Uint8Array(crypto.randomBytes(length));
}

export function sha256(data: Uint8Array): Uint8Array {
  return new Uint8Array(crypto.createHash("sha256").update(data).digest());
}

export function hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  return new Uint8Array(crypto.createHmac("sha256", key).update(data).digest());
}

export function hkdf(
  secret: Uint8Array,
  length: number,
  salt: Uint8Array = new Uint8Array(32),
  info: string = ""
): Uint8Array {
  const derived = crypto.hkdfSync("sha256", secret, salt, Buffer.from(info), length);
  return new Uint8Array(derived);
}

export function aesGcmEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array,
  additionalData?: Uint8Array
): { ciphertext: Uint8Array; tag: Uint8Array } {
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  if (additionalData) {
    cipher.setAAD(additionalData);
  }
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: new Uint8Array(encrypted),
    tag: new Uint8Array(tag),
  };
}

export function aesGcmDecrypt(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  additionalData?: Uint8Array
): Uint8Array {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  if (additionalData) {
    decipher.setAAD(additionalData);
  }
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return new Uint8Array(decrypted);
}

export function aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return new Uint8Array(encrypted);
}

export function aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return new Uint8Array(decrypted);
}
