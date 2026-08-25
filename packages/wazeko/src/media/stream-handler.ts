import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { pipeline } from "stream/promises";
import { Readable, Transform } from "stream";
import { MediaType, deriveMediaKeys, EncryptedMediaResult } from "../../../wazeko-core/src/index.js";

export interface StreamEncryptResult {
  mediaKey: Uint8Array;
  tempEncryptedFilePath: string;
  fileSha256: Buffer;
  fileEncSha256: Buffer;
  fileSizeBytes: number;
}

export class StreamMediaHandler {
  private tempDir: string;

  constructor(tempDir?: string) {
    this.tempDir = tempDir ?? path.join(os.tmpdir(), "wazeko-media-cache");
  }

  async init(): Promise<void> {
    await fsp.mkdir(this.tempDir, { recursive: true });
  }

  getTempPath(filename?: string): string {
    const name = filename ?? `media_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.tmp`;
    return path.join(this.tempDir, name);
  }

  /**
   * Encrypts a media stream directly to disk without buffering the entire payload in heap memory
   */
  async encryptMediaStream(
    sourceStream: Readable,
    mediaType: MediaType
  ): Promise<StreamEncryptResult> {
    await this.init();

    const mediaKey = crypto.randomBytes(32);
    const keys = deriveMediaKeys(mediaKey, mediaType);
    const destinationPath = this.getTempPath();

    const plainHasher = crypto.createHash("sha256");
    const encHasher = crypto.createHash("sha256");
    const hmac = crypto.createHmac("sha256", keys.macKey);
    hmac.update(keys.iv);

    const cipher = crypto.createCipheriv("aes-256-cbc", keys.cipherKey, keys.iv);
    const writeStream = fs.createWriteStream(destinationPath);

    let totalBytes = 0;

    const hashingTransform = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        plainHasher.update(chunk);
        totalBytes += chunk.length;
        callback(null, chunk);
      },
    });

    const cipherTransform = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        encHasher.update(chunk);
        hmac.update(chunk);
        callback(null, chunk);
      },
    });

    // Pipeline: Source -> Hash Plain -> Cipher -> Hash Encrypted/HMAC -> Disk Write
    await pipeline(
      sourceStream,
      hashingTransform,
      cipher,
      cipherTransform,
      writeStream
    );

    // Finalize 10-byte truncated MAC and append to the end of the encrypted file
    const fullMac = hmac.digest();
    const truncatedMac = fullMac.subarray(0, 10);
    encHasher.update(truncatedMac);

    await fsp.appendFile(destinationPath, truncatedMac);

    return {
      mediaKey,
      tempEncryptedFilePath: destinationPath,
      fileSha256: plainHasher.digest(),
      fileEncSha256: encHasher.digest(),
      fileSizeBytes: totalBytes,
    };
  }

  /**
   * Decrypts an encrypted media file from disk to a target plaintext file on disk using streaming
   */
  async decryptMediaFileStream(
    encryptedFilePath: string,
    mediaKey: Uint8Array,
    mediaType: MediaType,
    outputFilePath?: string
  ): Promise<string> {
    const stats = await fsp.stat(encryptedFilePath);
    if (stats.size < 10) {
      throw new Error("Encrypted media file is too small to contain a valid MAC");
    }

    const keys = deriveMediaKeys(mediaKey, mediaType);
    const targetPath = outputFilePath ?? this.getTempPath();
    const cipherLength = stats.size - 10;

    // Read MAC from end of file
    const fd = await fsp.open(encryptedFilePath, "r");
    const receivedMac = Buffer.alloc(10);
    await fd.read(receivedMac, 0, 10, cipherLength);
    await fd.close();

    // Verify MAC by streaming ciphertext
    const hmac = crypto.createHmac("sha256", keys.macKey);
    hmac.update(keys.iv);

    const macStream = fs.createReadStream(encryptedFilePath, { end: cipherLength - 1 });
    for await (const chunk of macStream) {
      hmac.update(chunk);
    }
    const fullMac = hmac.digest();
    const expectedMac = fullMac.subarray(0, 10);

    if (!crypto.timingSafeEqual(receivedMac, expectedMac)) {
      throw new Error("Media HMAC verification failed: media file is corrupted or tampered");
    }

    // Stream decrypt
    const readStream = fs.createReadStream(encryptedFilePath, { end: cipherLength - 1 });
    const decipher = crypto.createDecipheriv("aes-256-cbc", keys.cipherKey, keys.iv);
    const writeStream = fs.createWriteStream(targetPath);

    await pipeline(readStream, decipher, writeStream);

    return targetPath;
  }
}
