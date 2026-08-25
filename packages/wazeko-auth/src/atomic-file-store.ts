import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { Credentials } from "../../wazeko-core/src/index.js";
import { AuthStore } from "./store.js";

export interface AtomicFileStoreOptions {
  checksumValidation?: boolean;
}

export class AtomicFileAuthStore implements AuthStore {
  private dirPath: string;
  private options: AtomicFileStoreOptions;

  constructor(dirPath: string, options: AtomicFileStoreOptions = { checksumValidation: true }) {
    this.dirPath = path.resolve(dirPath);
    this.options = options;
  }

  private credsFilePath(): string {
    return path.join(this.dirPath, "credentials.json");
  }

  private checksumFilePath(): string {
    return path.join(this.dirPath, "credentials.checksum");
  }

  async load(): Promise<Credentials | null> {
    try {
      const filePath = this.credsFilePath();
      const content = await fs.readFile(filePath, "utf-8");

      if (this.options.checksumValidation) {
        try {
          const expectedChecksum = (await fs.readFile(this.checksumFilePath(), "utf-8")).trim();
          const actualChecksum = crypto.createHash("sha256").update(content, "utf-8").digest("hex");
          if (expectedChecksum !== actualChecksum) {
            throw new Error(`Checksum mismatch: file corrupted. Expected ${expectedChecksum}, got ${actualChecksum}`);
          }
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            throw err;
          }
        }
      }

      return JSON.parse(content) as Credentials;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  async save(credentials: Credentials): Promise<void> {
    await fs.mkdir(this.dirPath, { recursive: true });
    const filePath = this.credsFilePath();
    const tempFilePath = `${filePath}.tmp.${Date.now()}.${crypto.randomBytes(4).toString("hex")}`;
    const serialized = JSON.stringify(credentials, null, 2);

    // 1. Write to temporary file first
    await fs.writeFile(tempFilePath, serialized, "utf-8");

    // 2. Write checksum if enabled
    if (this.options.checksumValidation) {
      const checksum = crypto.createHash("sha256").update(serialized, "utf-8").digest("hex");
      const tempChecksumPath = `${this.checksumFilePath()}.tmp.${Date.now()}`;
      await fs.writeFile(tempChecksumPath, checksum, "utf-8");
      await fs.rename(tempChecksumPath, this.checksumFilePath());
    }

    // 3. Atomically rename temporary file to destination (OS atomic guarantee)
    await fs.rename(tempFilePath, filePath);
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.credsFilePath());
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }

    try {
      await fs.unlink(this.checksumFilePath());
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}
