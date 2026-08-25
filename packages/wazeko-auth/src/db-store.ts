import { Credentials } from "../../wazeko-core/src/index.js";
import { AuthStore } from "./store.js";

/**
 * Generic Key-Value adapter interface for distributed databases (Redis, Memcached, Postgres, MongoDB, Firestore)
 */
export interface KeyValueDatabaseAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

export interface KeyValAuthStoreOptions {
  keyPrefix?: string;
  ttlSeconds?: number;
}

export class KeyValAuthStore implements AuthStore {
  private adapter: KeyValueDatabaseAdapter;
  private sessionKey: string;
  private ttlSeconds?: number;

  constructor(
    adapter: KeyValueDatabaseAdapter,
    sessionId: string = "default",
    options: KeyValAuthStoreOptions = {}
  ) {
    this.adapter = adapter;
    const prefix = options.keyPrefix ?? "wazeko:auth:";
    this.sessionKey = `${prefix}${sessionId}`;
    this.ttlSeconds = options.ttlSeconds;
  }

  async load(): Promise<Credentials | null> {
    const raw = await this.adapter.get(this.sessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Credentials;
    } catch {
      return null;
    }
  }

  async save(credentials: Credentials): Promise<void> {
    const serialized = JSON.stringify(credentials);
    await this.adapter.set(this.sessionKey, serialized, this.ttlSeconds);
  }

  async clear(): Promise<void> {
    await this.adapter.del(this.sessionKey);
  }
}

/**
 * Standard in-memory simulated Redis / Distributed Key-Value store for testing and single-node instances
 */
export class InMemoryKeyValueAdapter implements KeyValueDatabaseAdapter {
  private map = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}
