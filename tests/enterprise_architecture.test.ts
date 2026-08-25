import test from "node:test";
import assert from "node:assert/strict";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { Readable } from "stream";

import {
  AtomicFileAuthStore,
  KeyValAuthStore,
  InMemoryKeyValueAdapter,
  SessionBackupManager,
  LocalArchiveBackupProvider,
} from "../packages/wazeko-auth/src/index.js";
import { initCredentials } from "../packages/wazeko-core/src/session.js";
import { parseJid } from "../packages/wazeko-types/src/jid.js";
import { Message } from "../packages/wazeko-types/src/message.js";
import {
  AntiBanRateLimiter,
  MessageQueue,
  StreamMediaHandler,
  TempCleanupManager,
  CommandRegistry,
  StructuredLogger,
  MonitoringServer,
  Wazeko,
  defaultClientConfig,
} from "../packages/wazeko/src/index.js";

test("Pillar 1: AtomicFileAuthStore safe write and checksum verification", async () => {
  const tempDir = path.join(os.tmpdir(), `wazeko_atomic_test_${Date.now()}`);
  const store = new AtomicFileAuthStore(tempDir, { checksumValidation: true });

  try {
    assert.equal(await store.load(), null);

    const creds = initCredentials();
    creds.registered = true;
    creds.clientId = "ATOMIC_CLIENT_ID_999";
    creds.me = parseJid("628111222333@s.whatsapp.net");

    await store.save(creds);

    // Verify atomic file & checksum existence
    const credsFile = path.join(tempDir, "credentials.json");
    const checksumFile = path.join(tempDir, "credentials.checksum");
    assert.equal(await fs.stat(credsFile).then(() => true).catch(() => false), true);
    assert.equal(await fs.stat(checksumFile).then(() => true).catch(() => false), true);

    const loaded = await store.load();
    assert.ok(loaded);
    assert.equal(loaded.registered, true);
    assert.equal(loaded.clientId, "ATOMIC_CLIENT_ID_999");
    assert.equal(loaded.me?.user, "628111222333");

    // Test tamper detection
    await fs.writeFile(credsFile, '{"tampered": true}', "utf-8");
    await assert.rejects(async () => {
      await store.load();
    }, /Checksum mismatch/);

    await store.clear();
    assert.equal(await store.load(), null);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

test("Pillar 1: KeyValAuthStore with simulated distributed database", async () => {
  const adapter = new InMemoryKeyValueAdapter();
  const store = new KeyValAuthStore(adapter, "session-cluster-1");

  assert.equal(await store.load(), null);

  const creds = initCredentials();
  creds.registered = true;
  creds.clientId = "REDIS_SESSION_XYZ";
  await store.save(creds);

  const loaded = await store.load();
  assert.ok(loaded);
  assert.equal(loaded.clientId, "REDIS_SESSION_XYZ");

  await store.clear();
  assert.equal(await store.load(), null);
});

test("Pillar 1: SessionBackupManager encrypted snapshot (AES-256-GCM) & restore", async () => {
  const adapter = new InMemoryKeyValueAdapter();
  const store = new KeyValAuthStore(adapter, "session-for-backup");
  const provider = new LocalArchiveBackupProvider();
  const backupManager = new SessionBackupManager({
    encryptionKey: "super-secret-passphrase-for-wazeko-cluster",
    backupProvider: provider,
  });

  const creds = initCredentials();
  creds.registered = true;
  creds.clientId = "SNAPSHOT_CLIENT_007";
  await store.save(creds);

  // Create encrypted snapshot
  const { backupId, location } = await backupManager.createBackup(store, "test-backup-01");
  assert.equal(backupId, "test-backup-01");
  assert.ok(location.startsWith("local://"));

  // Clear store to simulate catastrophic data loss
  await store.clear();
  assert.equal(await store.load(), null);

  // Restore from cloud snapshot
  const restored = await backupManager.restoreBackup(store, "test-backup-01");
  assert.equal(restored.clientId, "SNAPSHOT_CLIENT_007");

  const reloaded = await store.load();
  assert.ok(reloaded);
  assert.equal(reloaded.clientId, "SNAPSHOT_CLIENT_007");
});

test("Pillar 2: AntiBanRateLimiter & Priority MessageQueue dispatching", async () => {
  const dispatched: string[] = [];
  const fakeSender = {
    async sendMessage(to: any, content: any) {
      dispatched.push(content.text);
      return {
        id: `msg_${Date.now()}`,
        source: {
          chat: parseJid(typeof to === "string" ? to : to.user + "@s.whatsapp.net"),
          sender: parseJid("bot@s.whatsapp.net"),
          isFromMe: true,
          isGroup: false,
        },
        timestamp: Date.now(),
        status: "delivery_ack",
        content,
      } as Message;
    },
  };

  // Fast rate limiter for test purposes
  const rateLimiter = new AntiBanRateLimiter({
    minJitterMs: 10,
    maxJitterMs: 30,
    maxMessagesPerWindow: 100,
  });

  const queue = new MessageQueue(fakeSender, {
    concurrency: 1,
    rateLimiter,
    autoStart: false,
  });

  // Enqueue LOW, NORMAL, and HIGH priorities in reverse order
  const pLow = queue.enqueue("6281@s.whatsapp.net", { text: "Low Priority Broadcast" }, { priority: "LOW" });
  const pNorm = queue.enqueue("6281@s.whatsapp.net", { text: "Normal Message" }, { priority: "NORMAL" });
  const pHigh = queue.enqueue("6281@s.whatsapp.net", { text: "High Priority Alert" }, { priority: "HIGH" });

  queue.start();

  await Promise.all([pLow, pNorm, pHigh]);

  // High priority must be dispatched before normal, and normal before low
  assert.equal(dispatched[0], "High Priority Alert");
  assert.equal(dispatched[1], "Normal Message");
  assert.equal(dispatched[2], "Low Priority Broadcast");

  const stats = queue.getStats();
  assert.equal(stats.completedCount, 3);
  assert.equal(stats.failedCount, 0);
});

test("Pillar 3: StreamMediaHandler chunk encryption/decryption & TempCleanupManager", async () => {
  const tempDir = path.join(os.tmpdir(), `wazeko_media_test_${Date.now()}`);
  const handler = new StreamMediaHandler(tempDir);
  const cleanup = new TempCleanupManager({
    tempDir,
    ttlMs: 50, // 50ms for test
  });

  try {
    // 1. Create a dummy media stream
    const dummyPayload = Buffer.from("Hello WhatsApp Streaming Video/Audio Payload 1234567890".repeat(100));
    const sourceStream = Readable.from(dummyPayload);

    // 2. Encrypt stream directly to temporary file
    const encResult = await handler.encryptMediaStream(sourceStream, "video");
    assert.ok(encResult.tempEncryptedFilePath);
    assert.equal(encResult.fileSizeBytes, dummyPayload.length);

    // 3. Stream decrypt back to disk
    const decryptedPath = await handler.decryptMediaFileStream(
      encResult.tempEncryptedFilePath,
      encResult.mediaKey,
      "video"
    );

    const decryptedBytes = await fs.readFile(decryptedPath);
    assert.equal(decryptedBytes.toString("utf-8"), dummyPayload.toString("utf-8"));

    // 4. Test TTL Cleanup
    await new Promise((r) => setTimeout(r, 80)); // Wait for files to exceed TTL (50ms)
    const { deletedCount } = await cleanup.runCleanup();
    assert.ok(deletedCount >= 2, `Expected at least 2 temp files cleaned up, got ${deletedCount}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

test("Pillar 4: Dynamic CommandRegistry, MiddlewarePipeline and Hot Reloading", async () => {
  const client = new Wazeko(defaultClientConfig());
  const registry = new CommandRegistry({ prefix: "!" });

  let executionCount = 0;
  registry.register({
    name: "ping",
    aliases: ["p"],
    description: "Ping pong check",
    execute: async (ctx) => {
      executionCount++;
      await ctx.reply("Pong!");
    },
  });

  assert.ok(registry.getCommand("ping"));
  assert.ok(registry.getCommand("p"));

  // Dispatch ping command message
  const fakeMsg: Message = {
    id: "msg_123",
    source: {
      chat: parseJid("628999@s.whatsapp.net"),
      sender: parseJid("628999@s.whatsapp.net"),
      isFromMe: false,
      isGroup: false,
    },
    timestamp: Date.now(),
    status: "delivery_ack",
    content: { text: "!ping" },
  };

  const handled = await registry.handleMessage(client, fakeMsg);
  assert.equal(handled, true);
  assert.equal(executionCount, 1);

  // Unregister command
  registry.unregister("ping");
  assert.equal(registry.getCommand("ping"), undefined);
  assert.equal(registry.getCommand("p"), undefined);
});

test("Pillar 5: StructuredLogger JSON logging & MonitoringServer HTTP endpoints", async () => {
  const logs: any[] = [];
  const logger = new StructuredLogger({
    service: "test-wazeko",
    destination: (line) => logs.push(JSON.parse(line)),
  });

  logger.info("Test server booting", { port: 8080 });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].msg, "Test server booting");
  assert.equal(logs[0].service, "test-wazeko");
  assert.equal(logs[0].port, 8080);

  const client = new Wazeko(defaultClientConfig());
  const server = new MonitoringServer({
    port: 39999,
    client,
    qrCodeSupplier: () => "2@test_qr_challenge",
  });

  await server.start();

  try {
    // 1. Check /health
    const healthRes = await fetch("http://127.0.0.1:39999/health");
    assert.equal(healthRes.status, 200);
    const healthJson: any = await healthRes.json();
    assert.equal(healthJson.status, "healthy");
    assert.ok(healthJson.memory.heapUsedMb > 0);

    // 2. Check /metrics
    const metricsRes = await fetch("http://127.0.0.1:39999/metrics");
    assert.equal(metricsRes.status, 200);
    const metricsJson: any = await metricsRes.json();
    assert.ok(typeof metricsJson.wazeko_uptime_seconds === "number");

    // 3. Check /qr HTML page
    const qrRes = await fetch("http://127.0.0.1:39999/qr");
    assert.equal(qrRes.status, 200);
    const qrHtml = await qrRes.text();
    assert.ok(qrHtml.includes("Wazeko WhatsApp Auth & Monitor"));
    assert.ok(qrHtml.includes("qrCanvas"));

    // 4. Check /api/qr
    const apiQrRes = await fetch("http://127.0.0.1:39999/api/qr");
    assert.equal(apiQrRes.status, 200);
    const apiQrJson: any = await apiQrRes.json();
    assert.equal(apiQrJson.qr, "2@test_qr_challenge");
  } finally {
    await server.stop();
  }
});
