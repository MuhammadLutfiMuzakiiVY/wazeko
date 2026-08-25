<p align="center">
  <img src="assets/logo.png" alt="Wazeko Logo" width="480"/>
</p>

<h1 align="center">Wazeko</h1>

<p align="center">
  <strong>Fast. Async. TypeScript-native.</strong><br>
  <em>A modular, high-performance WhatsApp Web client library built from the ground up in TypeScript.</em>
</p>

<p align="center">
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/wazeko/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg?logo=typescript" alt="TypeScript 5.4+"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18%2B-green.svg?logo=node.js" alt="Node.js 18+"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/wazeko/stargazers"><img src="https://img.shields.io/github/stars/MuhammadLutfiMuzakiiVY/wazeko?style=flat&color=yellow" alt="GitHub Stars"></a>
</p>

---

## 📖 About Wazeko

**Wazeko** is an open-source, asynchronous client library for WhatsApp Web written in **TypeScript**. Designed for modern backend developers, automation engineers, and bot builders, Wazeko provides high-throughput, type-safe, and modular communication with WhatsApp's multi-device servers via WebSocket and binary protocols.

### 🌟 Why Wazeko?

- **💙 TypeScript-First**: 100% strict type safety for JIDs, message structures, events, and binary protocol frames.
- **⚡ Asynchronous Architecture**: Non-blocking event streaming supporting both `EventEmitter` (`client.on`) and Async Iterators (`for await (const event of client.events())`).
- **🧩 Monorepo & Modular**: Decoupled packages for transport, protocol parsing, authentication, and high-level messaging.
- **📱 QR & Pairing Code**: Built-in terminal ANSI QR code rendering and 8-character pairing code generation (`ABCD-1234`).
- **🔄 Resilient Reconnection**: Exponential backoff reconnection manager for rock-solid 24/7 uptime.
- **🌐 Cross-Runtime Compatible**: Designed for Node.js, with compatibility targets for Bun and Deno.

---

## 🏛️ Layered Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    Wazeko Application                     │
├───────────────────────────────────────────────────────────┤
│        Public API (Builder, Events, Async Iterators)      │
├───────────────────────────────────────────────────────────┤
│            Messaging API & Group Management               │
├───────────────────────────────────────────────────────────┤
│         Authentication Layer (QR Code / Pairing Code)      │
├───────────────────────────────────────────────────────────┤
│                   Multi-Device State                      │
├───────────────────────────────────────────────────────────┤
│       Protocol Layer (Binary Framing, Encoder, Decoder)   │
├───────────────────────────────────────────────────────────┤
│             WebSocket Transport Layer (TLS Duplex)        │
├───────────────────────────────────────────────────────────┤
│                    WhatsApp Web Servers                   │
└───────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo Packages

| Package | Version | Description |
|---|---|---|
| [`wazeko`](packages/wazeko) | `0.1.0` | Main client facade, builder API, event dispatcher, high-level messaging |
| [`@wazeko/core`](packages/wazeko-core) | `0.1.0` | Typed error system, session/device state, and crypto abstractions |
| [`@wazeko/transport`](packages/wazeko-transport) | `0.1.0` | WebSocket transport abstraction (`Socket` interface), reconnection manager |
| [`@wazeko/auth`](packages/wazeko-auth) | `0.1.0` | QR Code generator, pairing code logic, `AuthStore` (`FileAuthStore`, `MemoryAuthStore`) |
| [`@wazeko/protocol`](packages/wazeko-protocol) | `0.1.0` | Binary protocol encoder, decoder, single-byte token table, WAProto schema |
| [`@wazeko/types`](packages/wazeko-types) | `0.1.0` | Domain primitives: `Jid`, `Message`, `MessageContent`, `Event`, `GroupMetadata` |

---

## 🚀 Getting Started

### Installation

```bash
npm install wazeko
# or
pnpm add wazeko
# or
yarn add wazeko
```

### 1. Basic Connection & Async Event Loop

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder()
  .authStore("./auth")
  .printQr(true)
  .build();

await client.connect();

// Async iterator event stream
for await (const event of client.events()) {
  console.log(`[Event Received] ${event.name}:`, event.data);
}
```

### 2. Event Listener Style

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder()
  .authStore("./auth")
  .authMethod("qr")
  .printQr(true)
  .build();

client.on("qr", (qr) => {
  console.log(`Scan QR Code (Attempt #${qr.attempts})`);
});

client.on("connection.update", (state) => {
  console.log(`Connection state: ${state}`);
});

client.on("message", async (msg) => {
  if (msg.source.isFromMe) return;

  if ("text" in msg.content) {
    console.log(`Message from ${msg.source.chat.user}: ${msg.content.text}`);
    await client.reply(msg, `Echo: ${msg.content.text}`);
  }
});

await client.connect();
```

### 3. Login via Pairing Code

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder()
  .authStore("./auth")
  .pairingPhoneNumber("6281234567890")
  .build();

client.on("pairing.code", (codeEvent) => {
  console.log(`Enter this code on WhatsApp: ${codeEvent.code}`);
});

await client.connect();
```

### 4. Sending Messages & Replies

```ts
import { Wazeko } from "wazeko";

async function sendDemo(client: Wazeko) {
  // Send text message
  const msg = await client.sendMessage("6281234567890@s.whatsapp.net", {
    text: "Hello from Wazeko in TypeScript!",
  });

  // Reply to message
  await client.reply(msg, "Replying to earlier message");
}
```

---

## 🧪 Testing & Verification

Run tests:

```bash
npm test
```

Build packages:

```bash
npm run build
```

---

## 🗺️ Roadmap

- [x] **v0.1.0 — Foundation**: WebSocket transport, binary framing codec, QR Code rendering, Pairing Code, Session store, event queue & emitter.
- [ ] **v0.2.0 — Multi-Device & Encryption**: End-to-end Signal protocol handshake, pre-key rotation, full cipher pipeline.
- [ ] **v0.3.0 — Media & Groups**: Media encryption/upload/download, group administration APIs, community support.
- [ ] **v0.4.0 — Performance & Hardening**: Connection pooling, benchmark test suites, fuzz testing.
- [ ] **v1.0.0 — Production Ready**: Full API stability, documentation web, published to npm registry.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
