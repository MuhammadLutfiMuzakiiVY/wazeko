/**
 * Wazeko Enterprise Architecture Demo
 *
 * Demonstrates:
 * 1. Atomic Persistence & Session Cloud Backup
 * 2. Priority Anti-Ban Message Queue (High, Normal, Low)
 * 3. Stream-Based Media Handling & Background TTL Cleanup
 * 4. Modular Hot-Reloading Command Plugin Registry & Middleware Stack
 * 5. Structured JSON Logger & Web-Based QR Code Dashboard (/qr, /health, /metrics)
 */

import {
  Wazeko,
  defaultClientConfig,
  AtomicFileAuthStore,
  SessionBackupManager,
  LocalArchiveBackupProvider,
  AntiBanRateLimiter,
  StreamMediaHandler,
  TempCleanupManager,
} from "../packages/wazeko/src/index.js";
import * as path from "path";

async function main() {
  const config = defaultClientConfig();
  const authDir = path.resolve("./wazeko-session");

  // 1. Session Persistence: Atomic File Store & Encrypted Backup
  const authStore = new AtomicFileAuthStore(authDir, { checksumValidation: true });
  const backupManager = new SessionBackupManager({
    encryptionKey: "wazeko-cluster-master-secret-key-32b",
    backupProvider: new LocalArchiveBackupProvider(),
  });

  // 2. Initialize Client
  const client = new Wazeko(config, authStore);

  // Configure Rate Limiter (Human Jitter 1.5s - 4.0s)
  client.logger.info("Initializing Wazeko Enterprise WhatsApp Client...");

  // 3. Media Temp Directory & Automated TTL Cleanup (15 min TTL)
  const mediaHandler = new StreamMediaHandler(path.resolve("./media-cache"));
  const tempCleaner = new TempCleanupManager({
    tempDir: path.resolve("./media-cache"),
    ttlMs: 15 * 60 * 1000,
    intervalMs: 5 * 60 * 1000,
  });
  tempCleaner.start();

  // 4. Register Modular Commands
  client.plugins.register({
    name: "ping",
    aliases: ["p"],
    description: "Cek respons bot dan latency server",
    execute: async (ctx) => {
      await ctx.reply("🏓 Pong! Bot berjalan dengan stabil.");
    },
  });

  client.plugins.register({
    name: "status",
    description: "Lihat ringkasan status sistem dan antrean pesan",
    execute: async (ctx) => {
      const stats = client.queue.getStats();
      const mem = process.memoryUsage();
      const text = `📊 *Status Sistem Wazeko*\n` +
        `• Koneksi: ${client.getConnectionState()}\n` +
        `• RAM Heap: ${(mem.heapUsed / (1024 * 1024)).toFixed(2)} MB\n` +
        `• Antrean Pending: ${stats.pendingCount}\n` +
        `• Pesan Terkirim: ${stats.completedCount}`;
      await ctx.reply(text);
    },
  });

  // 5. Start Web Monitoring & QR Code Scanner Dashboard
  client.monitor.setQrSupplier(() => "2@example_qr_code_token");
  await client.monitor.start();
  client.logger.info("🌐 Web Monitoring & QR Scanner berjalan di http://localhost:3000/qr");
  client.logger.info("📊 Health API tersedia di http://localhost:3000/health");

  // Connect to WhatsApp
  await client.connect();

  // Example: Enqueuing High Priority vs Bulk Messages
  // await client.enqueueMessage("628123456789@s.whatsapp.net", { text: "🚨 Alert OTP Segera" }, { priority: "HIGH" });
  // await client.enqueueMessage("628987654321@s.whatsapp.net", { text: "📢 Newsletter Mingguan" }, { priority: "LOW" });
}

main().catch(console.error);
