<p align="center">
  <img src="assets/logo.png" alt="Wazeko Logo" width="480"/>
</p>

<h1 align="center">Wazeko</h1>

<p align="center">
  <strong>A modern, strongly typed, modular WhatsApp Web protocol client library for TypeScript & Node.js.</strong><br>
  <em>Designed for predictable asynchronous workloads, clean separation of concerns, and type safety.</em>
</p>

<p align="center">
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/wazeko/actions"><img src="https://img.shields.io/badge/tests-34%20passed-brightgreen.svg" alt="Test Status"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg?logo=typescript" alt="TypeScript 5.4+"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18%2B-green.svg?logo=node.js" alt="Node.js 18+"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/security-policy-blue.svg" alt="Security Policy"></a>
</p>

---

## 📖 About Wazeko

**Wazeko** is an open-source WhatsApp Web client library written entirely in **TypeScript** for **Node.js** (with Bun and Deno compatibility targets).

Rather than serving as an ad-hoc clone, Wazeko focuses on a clean architectural foundation:
- **Strict Domain Types**: Full type safety for JIDs (user, group, LID, device, compound agent IDs), messages, and events.
- **Modular Monorepo Architecture**: Decoupled packages separating protocol codecs, cryptography, transport, authentication, and high-level messaging.
- **Dual Event Consumption**: Supports both standard `EventEmitter` patterns and modern **Async Iterators** (`for await (const event of client.events())`).
- **Resilient Reconnection**: Exponential backoff manager designed for predictable connection recovery.

---

## 🏛️ Layered Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    Wazeko Application                     │
├───────────────────────────────────────────────────────────┤
│        Public API (Builder, Events, Async Iterators)      │
├───────────────────────────────────────────────────────────┤
│      Messaging API & Group Administration Engine          │
├───────────────────────────────────────────────────────────┤
│      Media Cryptography Pipeline (HKDF, AES-CBC, HMAC)    │
├───────────────────────────────────────────────────────────┤
│      Signal Protocol Engine (PreKey Rotation, Ratchet)    │
├───────────────────────────────────────────────────────────┤
│      Noise Protocol Handshake & FrameCipher (AES-GCM)     │
├───────────────────────────────────────────────────────────┤
│       Protocol Layer (Binary Framing, Encoder, Decoder)   │
├───────────────────────────────────────────────────────────┤
│             WebSocket Transport Layer (TLS Duplex)        │
└───────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo Packages

| Package | Version | Description |
|---|---|---|
| [`wazeko`](packages/wazeko) | `1.0.0` | Main client façade, builder API, event dispatcher, high-level messaging & group management |
| [`@wazeko/core`](packages/wazeko-core) | `1.0.0` | Signal Protocol, Noise Handshake, Media Crypto, error system, session/device state |
| [`@wazeko/transport`](packages/wazeko-transport) | `1.0.0` | WebSocket transport abstraction (`Socket` interface), reconnection manager |
| [`@wazeko/auth`](packages/wazeko-auth) | `1.0.0` | QR Code generator, pairing code logic, `AuthStore` (`FileAuthStore`, `MemoryAuthStore`) |
| [`@wazeko/protocol`](packages/wazeko-protocol) | `1.0.0` | Binary protocol encoder, decoder, single-byte token table, WAProto schema |
| [`@wazeko/types`](packages/wazeko-types) | `1.0.0` | Domain primitives: `Jid`, `Message`, `MessageContent`, `Event`, `GroupMetadata` |

---

## 🚀 Getting Started

### Installation

```bash
npm install wazeko
```

### 1. Basic Connection & Async Event Loop

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder()
  .authStore("./auth")
  .printQr(true)
  .build();

await client.connect();

for await (const event of client.events()) {
  console.log(`[Event Received] ${event.name}:`, event.data);
}
```

### 2. Group Operations

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder().authStore("./auth").build();
await client.connect();

// Create group
const group = await client.groups.create("Engineering Team", [
  "628123456789@s.whatsapp.net",
  "628987654321@s.whatsapp.net",
]);

// Update subject & description
await client.groups.updateSubject(group.id, "Core Engineers");
await client.groups.updateDescription(group.id, "WhatsApp client automation discussions");

// Add participant
await client.groups.addParticipants(group.id, ["628111222333@s.whatsapp.net"]);
```

### 3. Media Encryption Pipeline

```ts
import { encryptMedia, decryptMedia } from "@wazeko/core";

// Encrypt payload before uploading to WhatsApp CDN
const { mediaKey, encryptedPayload, fileSha256 } = encryptMedia(rawBuffer, "image");

// Decrypt and verify HMAC on download
const decrypted = decryptMedia(encryptedPayload, mediaKey, "image");
```

---

## 🧪 Benchmarks & Fuzz Testing

Run test suite:
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

## 🗺️ Architectural Maturity Roadmap

```text
Wazeko
├── v0.1 — Transport & Protocol Foundation (WebSocket, Framing, Token Dictionary)
├── v0.2 — Authentication & Signal Protocol (Noise Handshake, PreKey Rotation, Ratchet)
├── v0.3 — Multi-Device State & Media (HKDF Pipeline, Streaming AES-CBC, HMAC Verification)
├── v0.4 — Messaging & Group Administration (Creation, Participant Mutations, Invites)
├── v0.5 — Benchmarks & Fuzz Testing (Malformed Buffer Robustness, High-Throughput Suite)
└── v1.0 — Production Ready & Ecosystem Hardening (Full API Stability, Security Policy)
```

---

## 🛡️ Security

Please review [SECURITY.md](SECURITY.md) for vulnerability reporting procedures and cryptographic safety practices.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
