# `wazeko`

The main high-level client façade for **Wazeko**, providing builder-pattern configuration, priority anti-ban message queues, modular hot-reloading plugin architecture, and live observability dashboards.

---

## 📦 Installation

```bash
npm install wazeko
```

---

## 🚀 Key Features & APIs

### 1. Client Builder & Anti-Corrupt Session
```ts
import { Wazeko, defaultClientConfig, AtomicFileAuthStore } from "wazeko";

const authStore = new AtomicFileAuthStore("./session", { checksumValidation: true });
const client = new Wazeko(defaultClientConfig(), authStore);

await client.connect();
```

### 2. Priority Anti-Ban Message Queue (`client.enqueueMessage`)
Protects against WhatsApp anti-spam bans with dynamic human jitter (1.5s–4.0s) and sliding-window quota limits:
```ts
// High Priority: Urgent Alerts & OTP (dispatched immediately with minimal jitter)
await client.enqueueMessage("628123456789@s.whatsapp.net", { text: "🚨 OTP: 123456" }, { priority: "HIGH" });

// Normal Priority: Regular chat interactions
await client.enqueueMessage("628123456789@s.whatsapp.net", { text: "Halo apa kabar?" }, { priority: "NORMAL" });

// Low Priority: Bulk broadcasts (queued and throttled safely)
await client.enqueueMessage("628987654321@s.whatsapp.net", { text: "📢 Info promo" }, { priority: "LOW" });
```

### 3. Dynamic Hot-Reloading Command Registry (`client.plugins`)
```ts
client.plugins.register({
  name: "ping",
  aliases: ["p"],
  description: "Check bot status and ping latency",
  execute: async (ctx) => {
    await ctx.reply("🏓 Pong! Wazeko is running smoothly.");
  }
});
```

### 4. Built-In Web QR & Observability Server (`client.monitor`)
Starts a lightweight HTTP server serving:
- `GET /qr`: Live interactive responsive Web QR Code scanner UI.
- `GET /health`: Health status, memory heap usage (RSS & Heap), and queue backlogs.
- `GET /metrics`: Prometheus-compatible operational telemetry.

```ts
client.monitor.setQrSupplier(() => "2@qr_challenge_token");
await client.monitor.start();
// Open http://localhost:3000/qr in your mobile browser to scan!
```
