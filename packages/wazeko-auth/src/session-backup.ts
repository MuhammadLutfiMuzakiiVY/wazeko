import * as crypto from "crypto";
import { Credentials } from "../../wazeko-core/src/index.js";
import { AuthStore } from "./store.js";

export interface BackupProvider {
  upload(backupId: string, encryptedData: Buffer): Promise<string>;
  download(backupId: string): Promise<Buffer>;
}

export class LocalArchiveBackupProvider implements BackupProvider {
  private storage = new Map<string, Buffer>();

  async upload(backupId: string, encryptedData: Buffer): Promise<string> {
    this.storage.set(backupId, encryptedData);
    return `local://${backupId}`;
  }

  async download(backupId: string): Promise<Buffer> {
    const data = this.storage.get(backupId);
    if (!data) throw new Error(`Backup not found for ID: ${backupId}`);
    return data;
  }
}

export interface SessionBackupOptions {
  encryptionKey: Buffer | string; // 32-byte secret key for AES-256-GCM
  backupProvider: BackupProvider;
  intervalMs?: number;
}

export class SessionBackupManager {
  private encryptionKey: Buffer;
  private provider: BackupProvider;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: SessionBackupOptions) {
    if (typeof options.encryptionKey === "string") {
      this.encryptionKey = crypto.createHash("sha256").update(options.encryptionKey).digest();
    } else {
      if (options.encryptionKey.length !== 32) {
        throw new Error("Encryption key must be exactly 32 bytes for AES-256-GCM");
      }
      this.encryptionKey = options.encryptionKey;
    }
    this.provider = options.backupProvider;
  }

  /**
   * Encrypts credentials payload using AES-256-GCM with a random 12-byte IV and 16-byte auth tag
   */
  encryptSnapshot(credentials: Credentials): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    const plaintext = Buffer.from(JSON.stringify(credentials), "utf-8");
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Payload layout: [IV (12 bytes)] + [Auth Tag (16 bytes)] + [Ciphertext]
    return Buffer.concat([iv, tag, encrypted]);
  }

  /**
   * Decrypts an encrypted snapshot buffer
   */
  decryptSnapshot(encryptedBuffer: Buffer): Credentials {
    if (encryptedBuffer.length < 28) {
      throw new Error("Encrypted snapshot payload is too short");
    }
    const iv = encryptedBuffer.subarray(0, 12);
    const tag = encryptedBuffer.subarray(12, 28);
    const ciphertext = encryptedBuffer.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return JSON.parse(decrypted.toString("utf-8")) as Credentials;
  }

  /**
   * Captures credentials from the given AuthStore, encrypts it, and uploads via the configured provider
   */
  async createBackup(store: AuthStore, backupId: string = `snapshot-${Date.now()}`): Promise<{ backupId: string; location: string }> {
    const creds = await store.load();
    if (!creds) {
      throw new Error("Cannot create backup: No active credentials found in AuthStore");
    }

    const encrypted = this.encryptSnapshot(creds);
    const location = await this.provider.upload(backupId, encrypted);
    return { backupId, location };
  }

  /**
   * Restores credentials from a backup into the target AuthStore
   */
  async restoreBackup(store: AuthStore, backupId: string): Promise<Credentials> {
    const encrypted = await this.provider.download(backupId);
    const creds = this.decryptSnapshot(encrypted);
    await store.save(creds);
    return creds;
  }

  /**
   * Starts periodic automatic backup
   */
  startAutoBackup(store: AuthStore, intervalMs: number = 3600000, onBackup?: (location: string) => void): void {
    this.stopAutoBackup();
    this.timer = setInterval(async () => {
      try {
        const { location } = await this.createBackup(store);
        if (onBackup) onBackup(location);
      } catch (err) {
        // Suppress or handle backup errors without crashing application
      }
    }, intervalMs);
  }

  stopAutoBackup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
