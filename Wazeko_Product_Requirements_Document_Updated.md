# Wazeko — Product Requirements Document (PRD)

**Nama Proyek:** Wazeko
**Jenis:** Open-source WhatsApp Web client library
**Bahasa utama/core:** TypeScript
**Runtime utama:** Node.js
**Transport:** WebSocket
**Target Platform:** Linux, Windows, macOS
**Primary Language/Core:** TypeScript
**Runtime:** Node.js
**Alternative Runtimes:** Bun, Deno (compatibility target)
**Protocol Schema:** Protocol Buffers (WAProto)
**Package Ecosystem:** npm / pnpm / Yarn

**Target Developer:** TypeScript/JavaScript developers, backend developers, automation developers

## 1. Product Overview

**Wazeko** adalah library berbasis **TypeScript** yang menyediakan komunikasi dengan WhatsApp Web melalui **WebSocket**, dengan dukungan protocol/binary communication, autentikasi menggunakan **QR Code atau Pairing Code**, serta mekanisme **Multi-Device**.

Wazeko dirancang dengan fokus pada:

* performa tinggi;
* penggunaan memory yang efisien;
* asynchronous architecture;
* type safety;
* modularitas;
* reliability;
* developer experience yang sederhana.

Arsitektur dasarnya:

```text
┌─────────────────────────────┐
│       Wazeko Application    │
├─────────────────────────────┤
│        Public API           │
├─────────────────────────────┤
│      Message / Event        │
├─────────────────────────────┤
│    Authentication Layer     │
│    QR / Pairing Code        │
├─────────────────────────────┤
│      Multi-Device Layer     │
├─────────────────────────────┤
│       Protocol Layer        │
│ Binary Encoder / Decoder    │
├─────────────────────────────┤
│      WebSocket Layer        │
├─────────────────────────────┤
│       WhatsApp Web          │
└─────────────────────────────┘
```

---

# 2. Technology Stack

Wazeko menggunakan **TypeScript sebagai bahasa utama/core**. JavaScript adalah output/runtime-compatible language, sedangkan teknologi lain digunakan untuk protocol, configuration, tooling, documentation, CI/CD, dan build system.

| Kategori | Teknologi | Peran |
|---|---|---|
| Programming Language | **TypeScript** | Bahasa utama/core seluruh public API dan source utama |
| Runtime | **Node.js** | Runtime utama untuk production dan development |
| Alternative Runtime | **Bun / Deno** | Runtime alternatif yang kompatibel bila API/dependency memungkinkan |
| JavaScript | **JavaScript** | Hasil transpile TypeScript dan beberapa script/tooling |
| Transport | **WebSocket** | Komunikasi realtime dengan WhatsApp Web |
| WebSocket Implementation | **ws / abstraction sendiri** | Implementasi transport WebSocket |
| Protocol | **WhatsApp Web Protocol** | Protocol komunikasi utama |
| Binary Protocol | **Custom binary codec** | Encoding/decoding binary node dan packet |
| Schema / Serialization | **Protocol Buffers (Protobuf)** | Struktur dan serialisasi data protokol / WAProto |
| Protocol Definitions | **WAProto** | Generated protocol types/bindings |
| Cryptography | **Signal Protocol ecosystem** | Identity, sessions, pre-keys, sender keys, encryption state |
| HTTP | **fetch / undici** | HTTP request dan kebutuhan media/protocol tertentu |
| QR Code | **QR Code library** | Rendering/generating QR authentication |
| Serialization | **JSON** | Configuration, metadata, local state tertentu, dan interoperability |
| Configuration | **YAML** | GitHub Actions, CI/CD, dan konfigurasi tooling tertentu |
| Package Manager | **npm / pnpm / Yarn** | Dependency dan workspace management |
| Build | **TypeScript compiler + bundler** | Type checking, transpile, package build |
| Testing | **Jest / Vitest + integration/e2e tests** | Unit, integration, protocol, auth, dan regression testing |
| Linting | **ESLint** | Static analysis dan code quality |
| Formatting | **Prettier** | Consistent source formatting |
| Logging | **pino / structured logger** | Structured logging untuk production |
| Error Handling | **Typed Error classes** | Error taxonomy yang dapat ditangani consumer |
| Documentation | **Markdown** | README, guides, architecture, changelog |
| Documentation Web | **HTML + CSS** | Generated/static documentation web |
| Shell | **Shell/Bash** | Build, release, development, dan automation scripts |
| CI/CD | **GitHub Actions + YAML** | Test, lint, build, release, publish |
| Package Registry | **npm** | Distribusi package Wazeko |
| Repository | **GitHub** | Source control, issues, releases, CI/CD |

> **Catatan:** TypeScript adalah bahasa utama/core. JavaScript bukan pengganti TypeScript, melainkan target hasil kompilasi serta bahasa yang tetap digunakan untuk script/tooling tertentu.
>
> **Catatan:** Protocol Buffers adalah format/schema serialisasi protokol, bukan bahasa pemrograman utama.
>
> Dependency final harus dipilih setelah prototype protocol, authentication, Signal/session state, dan media pipeline berhasil diuji. Hindari coupling yang tidak perlu terhadap satu library.

---

# 2A. Language & File-Type Matrix

| Teknologi | Status | Penggunaan |
|---|---|---|
| **TypeScript (.ts, .mts, .cts)** | **Core** | Source code, public API, protocol, auth, session, message, event |
| **JavaScript (.js, .mjs, .cjs)** | Secondary | Runtime output dan tooling/script tertentu |
| **Protocol Buffers (.proto)** | Protocol | Schema dan definisi struktur data protokol |
| **JSON (.json)** | Configuration/Data | Metadata, package configuration, test fixtures, state tertentu |
| **YAML (.yml/.yaml)** | DevOps | GitHub Actions dan konfigurasi CI/CD |
| **Markdown (.md)** | Documentation | README, guides, architecture, changelog |
| **HTML (.html)** | Documentation Web | Output/static documentation tertentu |
| **CSS (.css)** | Documentation Web | Styling documentation/web output |
| **Shell/Bash (.sh)** | Automation | Build, test, release, setup, CI helper |
| **TOML (.toml)** | Optional tooling | Hanya jika tooling/dependency tertentu membutuhkannya; bukan core Wazeko |

**Prinsip:** jangan menambahkan bahasa hanya karena sebuah file format digunakan. HTML, CSS, JSON, YAML, Markdown, dan Shell adalah teknologi pendukung, bukan bahasa utama/core Wazeko.

---

# 3. Problem Statement

Developer TypeScript yang ingin membangun aplikasi yang berkomunikasi dengan WhatsApp Web membutuhkan library yang menyediakan:

* koneksi WebSocket;
* authentication;
* QR Code;
* Pairing Code;
* session persistence;
* Multi-Device;
* binary protocol;
* event system;
* reconnect;
* messaging API.

Wazeko menyediakan seluruh fondasi tersebut melalui API TypeScript yang type-safe dan asynchronous.

---

# 3A. Core Technical Principles

Wazeko harus mengikuti prinsip berikut:

1. **TypeScript-first** — seluruh public API dan core logic ditulis dalam TypeScript.
2. **Protocol-first** — protocol implementation menjadi source of truth; messaging API dibangun di atas protocol layer.
3. **Runtime-neutral where practical** — hindari API Node.js yang tidak perlu di core agar Bun/Deno tetap memungkinkan.
4. **Binary-safe** — gunakan `Uint8Array`/`Buffer` secara terkontrol dan hindari konversi binary ke string tanpa alasan.
5. **Typed protocol model** — semua node, packet, message, JID, event, credential, dan error memiliki type yang jelas.
6. **Crypto isolation** — cryptographic/session state dipisahkan dari transport dan public API.
7. **Testability** — protocol encoder/decoder, auth state, reconnect, event routing, dan state sync harus dapat diuji tanpa koneksi WhatsApp penuh bila memungkinkan.
8. **No browser automation dependency** — Wazeko berkomunikasi melalui WebSocket/protocol layer, bukan melalui Selenium, Puppeteer, Playwright, atau Chromium sebagai core.
9. **Backward compatibility** — perubahan public API harus mengikuti versioning dan changelog.
10. **Security by design** — credential, identity keys, session keys, dan sensitive metadata tidak boleh masuk log secara default.

---

# 4. Product Goals

### Primary Goal

Membangun **WhatsApp Web client library berbasis TypeScript** yang dapat:

1. membuat koneksi WebSocket;
2. melakukan authentication;
3. menghasilkan QR Code;
4. mendukung Pairing Code;
5. menyimpan credential;
6. melakukan reconnect;
7. menangani binary protocol;
8. mengelola device/session;
9. menerima event;
10. menyediakan messaging API.

### Non-Goals

Wazeko **tidak** ditujukan untuk:

* spam;
* unsolicited bulk messaging;
* penyalahgunaan akun;
* bypass sistem keamanan;
* aktivitas yang melanggar ketentuan layanan WhatsApp.

---

# 5. Core Architecture

Wazeko menggunakan pendekatan **layered architecture**.

```text
Application
     │
     ▼
┌───────────────┐
│  Wazeko API   │
└───────┬───────┘
        ▼
┌───────────────┐
│ Event System  │
└───────┬───────┘
        ▼
┌───────────────┐
│ Message Layer │
└───────┬───────┘
        ▼
┌────────────────┐
│ Auth / Session  │
└───────┬────────┘
        ▼
┌────────────────┐
│ Multi-Device    │
└───────┬────────┘
        ▼
┌────────────────┐
│ Protocol Layer  │
└───────┬────────┘
        ▼
┌────────────────┐
│ WebSocket Layer │
└───────┬────────┘
        ▼
     WhatsApp
```

---

# 6. WebSocket Layer

WebSocket merupakan transport layer utama Wazeko.

Tanggung jawab:

* membuka connection;
* menerima packet;
* mengirim packet;
* ping/pong;
* timeout;
* connection state;
* disconnect;
* reconnect;
* error handling.

Interface awal:

```ts
export interface Socket {
  connect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}
```

Lifecycle:

```text
DISCONNECTED
      ↓
CONNECTING
      ↓
AUTHENTICATING
      ↓
CONNECTED
      ↓
RECONNECTING
      ↓
CONNECTED
```

---

# 7. Protocol / Binary Communication

Protocol layer adalah komponen inti Wazeko.

Tanggung jawab:

* binary encoding;
* binary decoding;
* packet parsing;
* serialization;
* deserialization;
* node/tree representation;
* protocol validation;
* packet routing.

Struktur:

```text
protocol/
├── encoder.rs
├── decoder.rs
├── parser.rs
├── serializer.rs
├── node.rs
└── packet.rs
```

Contoh abstraction:

```ts
export interface Encoder {
  encode(data: ProtocolNode): Uint8Array;
}

export interface Decoder {
  decode(data: Uint8Array): ProtocolNode;
}
```

**Prinsip penting:** protocol layer harus dibuat terpisah dari WebSocket sehingga transport dan protocol dapat diuji secara independen.

---

# 8. Authentication

Wazeko memiliki dua metode authentication:

### QR Code

```text
Wazeko
   │
   ▼
WebSocket Connection
   │
   ▼
Authentication Challenge
   │
   ▼
Generate QR
   │
   ▼
User Scan QR
   │
   ▼
Device Authenticated
   │
   ▼
Save Credentials
   │
   ▼
CONNECTED
```

### Pairing Code

```text
Wazeko
   │
   ▼
Request Pairing
   │
   ▼
Generate Pairing Code
   │
   ▼
User enters code
   │
   ▼
Authentication
   │
   ▼
Save Credentials
```

API:

```ts
export type AuthMethod =
  | "qr"
  | "pairing-code";
```

---

# 9. Session & Credential Management

Wazeko harus dapat menyimpan session secara persistent.

Contoh:

```text
auth/
├── credentials.json
├── device.json
├── keys/
└── session.json
```

API:

```rust
let client = Wazeko::builder()
    .auth_store("./auth")
    .build();
```

Storage abstraction:

```ts
export interface AuthStore {
  load(): Promise<Credentials | null>;
  save(credentials: Credentials): Promise<void>;
  clear(): Promise<void>;
}
```

Dengan abstraction ini nantinya bisa dibuat:

```text
FileAuthStore
RedisAuthStore
DatabaseAuthStore
MemoryAuthStore
CustomAuthStore
```

---

# 10. Multi-Device

Wazeko harus menggunakan arsitektur yang mendukung **Multi-Device**.

Komponen:

```text
Device Identity
      │
      ▼
Session
      │
      ├── Keys
      ├── Credentials
      ├── Device State
      └── Sync State
```

Fitur:

* device identity;
* credential management;
* cryptographic key state;
* session recovery;
* state synchronization;
* reconnect;
* device state tracking.

---

# 11. Event System

Wazeko menggunakan event-driven architecture.

Contoh:

```ts
client.on("connection.update", (event) => {
  console.log(event);
});
```

Event utama:

```text
connection.update
qr
pairing.code
auth.update
message
message.update
message.delete
group.update
presence.update
error
disconnect
```

TypeScript dapat menggunakan async iterator, EventEmitter, atau channel/queue abstraction untuk event distribution.

Contoh konsep:

```ts
for await (const event of client.events()) {
  console.log(event);
}
```

---

# 12. Messaging API

Setelah core protocol stabil, Wazeko menyediakan messaging API.

Contoh:

```ts
await client.sendMessage(
  "628123456789@s.whatsapp.net",
  { text: "Hello from Wazeko!" }
);
```

Jenis pesan:

* Text
* Image
* Video
* Audio
* Document
* Sticker
* Contact
* Location
* Reaction
* Reply

---

# 13. Group API

Tahap selanjutnya:

```ts
await client.groups.info(jid);
await client.groups.participants(jid);
```

Fitur:

* group information;
* participants;
* add participant;
* remove participant;
* promote;
* demote;
* group subject;
* group description;
* invite.

---

# 14. Media System

Media manager bertanggung jawab terhadap:

```text
MediaManager
├── Upload
├── Download
├── Encryption
├── Decryption
├── Hash
└── Validation
```

Contoh:

```ts
await client.sendImage(
  jid,
  imageBytes,
  { caption: "Hello Wazeko" }
);
```

---

# 15. Error System

Gunakan typed error classes dan error codes untuk membuat error yang terstruktur.

```ts
export class WazekoError extends Error {
  constructor(
    public readonly code: WazekoErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "WazekoError";
  }
}

export type WazekoErrorCode =
  | "CONNECTION"
  | "AUTHENTICATION"
  | "PROTOCOL"
  | "SESSION"
  | "MESSAGE"
  | "MEDIA";
```

Pengguna library dapat menangani error secara spesifik.

---

# 16. Project Structure

Struktur repository yang direkomendasikan:

```text
wazeko/
│
├── packages/
│   ├── wazeko/
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── config.ts
│   │   │   ├── events.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── wazeko-core/
│   │   ├── src/
│   │   │   ├── protocol/
│   │   │   ├── session/
│   │   │   ├── device/
│   │   │   ├── crypto/
│   │   │   └── errors/
│   │   └── package.json
│   │
│   ├── wazeko-transport/
│   │   ├── src/
│   │   │   ├── websocket.ts
│   │   │   ├── reconnect.ts
│   │   │   └── connection-state.ts
│   │   └── package.json
│   │
│   ├── wazeko-auth/
│   │   ├── src/
│   │   │   ├── qr.ts
│   │   │   ├── pairing.ts
│   │   │   ├── credentials.ts
│   │   │   └── store.ts
│   │   └── package.json
│   │
│   ├── wazeko-protocol/
│   │   ├── src/
│   │   │   ├── encoder.ts
│   │   │   ├── decoder.ts
│   │   │   ├── parser.ts
│   │   │   ├── node.ts
│   │   │   └── packet.ts
│   │   ├── proto/
│   │   │   └── *.proto
│   │   └── package.json
│   │
│   └── wazeko-types/
│       ├── src/
│       │   ├── message.ts
│       │   ├── contact.ts
│       │   ├── group.ts
│       │   ├── jid.ts
│       │   └── events.ts
│       └── package.json
│
├── proto/
├── examples/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── protocol/
│   └── e2e/
├── docs/
├── scripts/
├── .github/
│   └── workflows/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── prettier.config.mjs
├── jest.config.ts
├── README.md
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

### Workspace

Gunakan monorepo/workspace berbasis npm, pnpm, atau Yarn. Contoh konsep:

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### Core dependency boundaries

```text
wazeko
  │
  ├── wazeko-core
  ├── wazeko-transport
  ├── wazeko-auth
  ├── wazeko-protocol
  └── wazeko-types
```

Protocol, transport, authentication, crypto/session, dan public API harus dipisahkan agar dapat diuji serta dikembangkan secara independen.

---

# 17. MVP — Wazeko v0.1

Versi pertama **jangan langsung membuat semua fitur WhatsApp**.

Prioritas:

### Milestone 1 — Core

* [ ] TypeScript workspace
* [ ] Tokio runtime
* [ ] WebSocket connection
* [ ] Connection manager
* [ ] Event system
* [ ] Error system
* [ ] Logging

### Milestone 2 — Protocol

* [ ] Binary encoder
* [ ] Binary decoder
* [ ] Node parser
* [ ] Node serializer
* [ ] Packet handler

### Milestone 3 — Authentication

* [ ] Device identity
* [ ] QR authentication
* [ ] Pairing Code
* [ ] Credential storage
* [ ] Session restoration

### Milestone 4 — Multi-Device

* [ ] Key management
* [ ] Device state
* [ ] Session state
* [ ] Synchronization
* [ ] Reconnect

### Milestone 5 — Messaging

* [ ] Receive message
* [ ] Send text
* [ ] Reply
* [ ] Message events

---

# 18. Definition of Done — v0.1

Wazeko v0.1 dinyatakan berhasil apabila developer dapat melakukan:

```text
npm add wazeko
        │
        ▼
Create Wazeko Client
        │
        ▼
WebSocket Connect
        │
        ▼
QR / Pairing Code
        │
        ▼
Authentication
        │
        ▼
Session Saved
        │
        ▼
Reconnect
        │
        ▼
Receive Event
        │
        ▼
Receive Message
        │
        ▼
Send Message
```

Contoh target API:

```ts
import { Wazeko } from "wazeko";

const client = Wazeko.builder()
  .authStore("./auth")
  .build();

await client.connect();

for await (const event of client.events()) {
  console.log(event);
}
```

---

# 19. Roadmap

```text
v0.1
 │
 ├── WebSocket
 ├── Protocol
 ├── QR
 ├── Pairing
 └── Session
       │
       ▼
v0.2
 │
 ├── Multi-Device
 ├── Message Receive
 └── Message Send
       │
       ▼
v0.3
 │
 ├── Media
 ├── Groups
 └── Presence
       │
       ▼
v0.4
 │
 ├── Performance
 ├── Stability
 ├── Documentation
 └── Testing
       │
       ▼
v1.0
 │
 └── Production-ready TypeScript Library
```

## 20. Positioning

**Wazeko** bukan sekadar bot WhatsApp. Positioning yang lebih kuat:

> **Wazeko — A TypeScript-native asynchronous WhatsApp Web client library.**

Tagline alternatif:

> **Fast. Async. TypeScript-native.**

atau:

> **WhatsApp Web connectivity, powered by TypeScript.**

Dengan positioning ini, **TypeScript menjadi identitas utama Wazeko**, sementara WebSocket, binary protocol, WAProto/Protocol Buffers, Signal cryptography, QR/Pairing Code, dan Multi-Device menjadi fondasi teknologinya.
