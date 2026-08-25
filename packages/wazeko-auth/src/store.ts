import * as fs from "fs/promises";
import * as path from "path";
import { Credentials } from "../../wazeko-core/src/index.js";

export interface AuthStore {
  load(): Promise<Credentials | null>;
  save(credentials: Credentials): Promise<void>;
  clear(): Promise<void>;
}

export class FileAuthStore implements AuthStore {
  private dirPath: string;

  constructor(dirPath: string) {
    this.dirPath = path.resolve(dirPath);
  }

  private credsFilePath(): string {
    return path.join(this.dirPath, "credentials.json");
  }

  async load(): Promise<Credentials | null> {
    try {
      const filePath = this.credsFilePath();
      const content = await fs.readFile(filePath, "utf-8");
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
    const serialized = JSON.stringify(credentials, null, 2);
    await fs.writeFile(filePath, serialized, "utf-8");
  }

  async clear(): Promise<void> {
    try {
      const filePath = this.credsFilePath();
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }
}

export class MemoryAuthStore implements AuthStore {
  private credentials: Credentials | null = null;

  async load(): Promise<Credentials | null> {
    return this.credentials;
  }

  async save(credentials: Credentials): Promise<void> {
    this.credentials = { ...credentials };
  }

  async clear(): Promise<void> {
    this.credentials = null;
  }
}
