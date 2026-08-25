<p align="center">
  <img src="assets/logo.png" alt="Wazeko Logo" width="480"/>
</p>

<h1 align="center">Wazeko</h1>

<p align="center">
  <strong>Fast. Async. Type-Safe. Production-Ready.</strong><br>
  <em>An enterprise-grade, asynchronous WhatsApp Web client library built from the ground up in TypeScript.</em>
</p>

<p align="center">
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/wazeko/actions"><img src="https://img.shields.io/badge/tests-34%20passed-brightgreen.svg" alt="Test Status"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg?logo=typescript" alt="TypeScript 5.4+"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18%2B-green.svg?logo=node.js" alt="Node.js 18+"></a>
  <a href="#license"><img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

---

## 📖 About Wazeko

**Wazeko** is an open-source, production-ready WhatsApp Web client library written in **TypeScript**. Designed for high-scale automation, enterprise chatbots, and backend architectures, Wazeko delivers a high-throughput, modular, and type-safe engine with full support for **Signal Protocol E2EE**, **Noise Protocol Transport Handshakes**, **Streaming Media Cryptography**, and **Group Administration**.

---

## 🌟 Key Features

- **🛡️ Full End-to-End Encryption (Signal Protocol)**:
  - X3DH key agreement, Pre-Key Bundle generation and rotation (`rotateSignedPreKey`).
  - Double Ratchet session cipher with per-message forward secrecy.
- **🔐 Noise Protocol Transport Security**:
  - `Noise_XX_25519_AESGCM_SHA256` state machine for secure WebSocket packet framing.
  - Bidirectional frame ciphering with AEAD integrity verification.
- **🖼️ Streaming Media Cryptography (MMS CDN)**:
  - HKDF media key expansion (IV, CipherKey, MacKey, RefKey) for images, video, audio, documents, and stickers.
  - Streaming AES-256-CBC cipher with 10-byte truncated HMAC-SHA256 integrity checks.
- **👥 Full Group Administration API**:
  - Create groups, update subjects/descriptions, add/remove/promote/demote participants, generate invite codes, and join/leave groups.
- **⚡ High-Throughput & Fuzz Tested**:
  - Binary Protocol Decoder delivering **>180,000 ops/sec**.
  - Battle-tested with automated fuzzing against random byte corruptions and malformed packets.
- **💙 Modern TypeScript & Async Iterators**:
  - Supports both `for await (const event of client.events())` and `EventEmitter` (`client.on`).
  - Zero `any` policy for 100% strict type safety.

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
| [`wazeko`](packages/wazeko) | `1.0.0` | Main client facade, builder API, event dispatcher, high-level messaging & group management |
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

### 2. Group Administration

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder().authStore("./auth").build();
await client.connect();

// Create group
const group = await client.groups.create("Dev Team", [
  "628123456789@s.whatsapp.net",
  "628987654321@s.whatsapp.net",
]);

// Update subject & description
await client.groups.updateSubject(group.id, "Core Engineers");
await client.groups.updateDescription(group.id, "Official WhatsApp bot engineering group");

// Add participant
await client.groups.addParticipants(group.id, ["628111222333@s.whatsapp.net"]);

// Get invite link code
const inviteCode = await client.groups.getInviteCode(group.id);
console.log("Join link code:", inviteCode);
```

### 3. Media Encryption & Decryption

```ts
import { encryptMedia, decryptMedia } from "@wazeko/core";

// Encrypt image before upload
const rawImage = Buffer.from([...]);
const { mediaKey, encryptedPayload, fileSha256 } = encryptMedia(rawImage, "image");

// Decrypt downloaded payload with integrity check
const decryptedBuffer = decryptMedia(encryptedPayload, mediaKey, "image");
```

---

## 🧪 Testing & Benchmarks

Run unit & fuzz tests:
```bash
npm test
```

Run throughput benchmarks:
```bash
npm run bench
```

**Benchmark Results:**
- Protocol Binary Decoding: **~181,000 ops/sec**
- Protocol Binary Encoding: **~75,000 ops/sec**
- SHA-256 Throughput (1KB): **~128,000 ops/sec**
- AES-GCM Encrypt + Decrypt (1KB): **~27,000 ops/sec**

---

## 🗺️ Roadmap & Milestones

- [x] **v0.1.0 — Foundation**: WebSocket transport, binary framing codec, QR Code rendering, Pairing Code, Session store, event queue & emitter.
- [x] **v0.2.0 — Signal & Noise Protocol**: Full `Noise_XX_25519_AESGCM_SHA256` handshake, `FrameCipher`, Pre-Key generation & rotation, Double Ratchet cipher pipeline.
- [x] **v0.3.0 — Media & Groups**: Media HKDF key expansion, streaming encryption/decryption with HMAC validation, complete Group Administration API.
- [x] **v0.4.0 — Performance & Hardening**: Automated fuzzing test suites, random byte flip resistance, throughput benchmark suite.
- [x] **v1.0.0 — Production Ready**: Monorepo v1.0.0 release, full API stability, comprehensive documentation, ready for npm registry.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
