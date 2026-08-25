<p align="center">
  <img src="assets/logo.png" alt="Wazeko Logo" width="480"/>
</p>

<h1 align="center">Wazeko</h1>

<p align="center">
  <strong>A modern, strongly typed, enterprise-grade WhatsApp Web protocol client library for TypeScript & Node.js.</strong><br>
  <em>Designed for predictable asynchronous workloads, anti-corrupt persistence, anti-ban message queues, and type safety.</em>
</p>

<p align="center">
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/Wazeko/actions"><img src="https://img.shields.io/badge/tests-41%20passed-brightgreen.svg" alt="Test Status"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg?logo=typescript" alt="TypeScript 5.4+"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B%20%7C%2022%2B-green.svg?logo=node.js" alt="Node.js Support"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/security-policy-blue.svg" alt="Security Policy"></a>
</p>

---

## 📖 About Wazeko

**Wazeko** is an open-source WhatsApp Web client library written entirely in **TypeScript** for **Node.js** (with Bun and Deno compatibility targets).

Rather than serving as an ad-hoc clone, **Wazeko** focuses on a clean, robust enterprise foundation:
- **Anti-Corrupt Session Persistence**: Atomic write mechanisms (`.tmp` + `fs.rename`) with SHA-256 checksum integrity and distributed database stores (Redis, MongoDB, PostgreSQL).
- **Anti-Ban Message Queue**: Built-in human jitter delay (1.5s–4.0s) and sliding-window rate limiters with priority routing (`HIGH`, `NORMAL`, `LOW`).
- **Stream-Based Media Processing**: Low-memory media handling using Node.js `stream.pipeline` directly to disk, with automated TTL cleanup workers.
- **Modular Hot-Reloading Plugins**: ESM-based dynamic command registry and onion-model middleware pipelines without socket disconnection.
- **Observability & Web Dashboard**: Structured JSON logging (Pino/Winston format) and lightweight HTTP monitoring with live Web QR code scanner (`/qr`, `/health`, `/metrics`).

---

## 🏛️ Layered Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    Wazeko Application                     │
├───────────────────────────────────────────────────────────┤
│    Observability & Web Monitoring (/health, /metrics, /qr)│
├───────────────────────────────────────────────────────────┤
│    Modular Plugin & Middleware Pipeline (Hot-Reloading)   │
├───────────────────────────────────────────────────────────┤
│    Priority Message Queue & Anti-Ban Jitter Rate Limiter  │
├───────────────────────────────────────────────────────────┤
│    Stream Media Pipeline (stream.pipeline, TTL Cleaner)   │
├───────────────────────────────────────────────────────────┤
│    Anti-Corrupt Session Storage (Atomic File, Redis, S3)  │
├───────────────────────────────────────────────────────────┤
│    Signal Protocol & Noise XX Handshake (FrameCipher)     │
├───────────────────────────────────────────────────────────┤
│    Protocol Layer (Binary Framing, Codec, WAProto Schema) │
├───────────────────────────────────────────────────────────┤
│    WebSocket Transport Layer (TLS Duplex, Backoff)        │
└───────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo Packages

| Package | Version | Description |
|---|---|---|
| [`wazeko`](packages/wazeko) | `1.0.0` | Main client façade, builder API, message queue, plugin registry, logger, and web monitor |
| [`@wazeko/core`](packages/wazeko-core) | `1.0.0` | Signal Protocol, Noise Handshake, Media Crypto, error system, session/device state |
| [`@wazeko/transport`](packages/wazeko-transport) | `1.0.0` | WebSocket transport abstraction (`Socket` interface), reconnection manager |
| [`@wazeko/auth`](packages/wazeko-auth) | `1.0.0` | `AtomicFileAuthStore`, `KeyValAuthStore`, `SessionBackupManager` (AES-256-GCM), QR & Pairing |
| [`@wazeko/protocol`](packages/wazeko-protocol) | `1.0.0` | Binary protocol encoder, decoder, single-byte token table, WAProto schema |
| [`@wazeko/types`](packages/wazeko-types) | `1.0.0` | Domain primitives: `Jid`, `Message`, `MessageContent`, `Event`, `GroupMetadata` |

---

## 🚀 Getting Started

### 1. Basic Connection & Anti-Corrupt Session

```ts
import { Wazeko, defaultClientConfig, AtomicFileAuthStore } from "wazeko";

// Initialize anti-corrupt atomic storage
const authStore = new AtomicFileAuthStore("./session", { checksumValidation: true });
const client = new Wazeko(defaultClientConfig(), authStore);

// Register a hot-reloadable command
client.plugins.register({
  name: "ping",
  execute: async (ctx) => {
    await ctx.reply("🏓 Pong! Wazeko Online.");
  }
});

// Start Web QR & Monitoring Dashboard at http://localhost:3000/qr
await client.monitor.start();
await client.connect();
```

### 2. Priority Anti-Ban Message Queue

```ts
// Urgent OTP / Critical Notification (Instant dispatch)
await client.enqueueMessage("628123456789@s.whatsapp.net", { text: "🚨 Kode OTP: 882910" }, { priority: "HIGH" });

// Regular Chat Message
await client.enqueueMessage("628123456789@s.whatsapp.net", { text: "Halo apa kabar?" }, { priority: "NORMAL" });

// Broadcast Newsletter (Batched with human jitter 1.5s - 4.0s)
await client.enqueueMessage("628987654321@s.whatsapp.net", { text: "📢 Newsletter Mingguan" }, { priority: "LOW" });
```

---

## 🧪 Benchmarks & Fuzz Testing

Run test suite (41/41 tests passing):
```bash
npm test
```

Run throughput benchmark suite:
```bash
npm run bench
```

**Measured Benchmarks (Node.js 24 / AMD64):**
- Protocol Binary Decoding: **~181,200 ops/sec**
- Protocol Binary Encoding: **~75,300 ops/sec**
- SHA-256 Throughput (1KB): **~128,800 ops/sec**
- AES-GCM Encrypt + Decrypt (1KB): **~27,000 ops/sec**

---

## 🛡️ Security

Please review [SECURITY.md](SECURITY.md) for vulnerability reporting procedures and cryptographic safety practices.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
