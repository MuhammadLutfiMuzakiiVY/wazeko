# Wazeko — Product Requirements Document (PRD)

**Nama Proyek:** Wazeko
**Jenis:** Open-source WhatsApp Web client library
**Bahasa:** Rust
**Runtime:** Tokio
**Transport:** WebSocket
**Target Platform:** Linux, Windows, macOS
**Target Developer:** Rust developers, backend developers, automation developers

## 1. Product Overview

**Wazeko** adalah library berbasis **Rust** yang menyediakan komunikasi dengan WhatsApp Web melalui **WebSocket**, dengan dukungan protocol/binary communication, autentikasi menggunakan **QR Code atau Pairing Code**, serta mekanisme **Multi-Device**.

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

| Komponen             | Teknologi                                   |
| -------------------- | ------------------------------------------- |
| Programming Language | **Rust**                                    |
| Async Runtime        | **Tokio**                                   |
| WebSocket            | **tokio-tungstenite** / abstraction sendiri |
| Serialization        | Serde                                       |
| Binary Processing    | Custom binary codec                         |
| QR Code              | Rust QR library                             |
| HTTP                 | Reqwest                                     |
| Cryptography         | RustCrypto ecosystem                        |
| Error Handling       | thiserror                                   |
| Logging              | tracing                                     |
| CLI Testing          | cargo                                       |
| Testing              | cargo test                                  |
| Package              | Cargo / crates.io                           |
| Repository           | GitHub                                      |
| CI/CD                | GitHub Actions                              |

> Dependency final sebaiknya dipilih setelah prototype protocol dibuat, supaya Wazeko tidak terlalu bergantung pada library tertentu.

---

# 3. Problem Statement

Developer Rust yang ingin membangun aplikasi yang berkomunikasi dengan WhatsApp Web membutuhkan library yang menyediakan:

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

Wazeko menyediakan seluruh fondasi tersebut melalui API Rust yang aman dan asynchronous.

---

# 4. Product Goals

### Primary Goal

Membangun **WhatsApp Web client library berbasis Rust** yang dapat:

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

```rust
#[async_trait]
pub trait Socket {
    async fn connect(&mut self) -> Result<()>;
    async fn send(&mut self, data: Vec<u8>) -> Result<()>;
    async fn close(&mut self) -> Result<()>;
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

```rust
pub trait Encoder {
    fn encode(&self, data: &ProtocolNode) -> Result<Vec<u8>>;
}

pub trait Decoder {
    fn decode(&self, data: &[u8]) -> Result<ProtocolNode>;
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

```rust
pub enum AuthMethod {
    QrCode,
    PairingCode,
}
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

```rust
#[async_trait]
pub trait AuthStore {
    async fn load(&self) -> Result<Option<Credentials>>;
    async fn save(&self, credentials: &Credentials) -> Result<()>;
    async fn clear(&self) -> Result<()>;
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

```rust
client.on(Event::ConnectionUpdate, |event| {
    println!("{:?}", event);
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

Rust dapat menggunakan channel asynchronous untuk event distribution.

Contoh konsep:

```rust
let mut events = client.events();

while let Some(event) = events.recv().await {
    println!("{:?}", event);
}
```

---

# 12. Messaging API

Setelah core protocol stabil, Wazeko menyediakan messaging API.

Contoh:

```rust
client
    .send_message(
        "628123456789@s.whatsapp.net",
        Message::text("Hello from Wazeko!")
    )
    .await?;
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

```rust
client.groups().info(jid).await?;
client.groups().participants(jid).await?;
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

```rust
client
    .send_image(
        jid,
        image_bytes,
        Some("Hello Wazeko")
    )
    .await?;
```

---

# 15. Error System

Gunakan `thiserror` untuk membuat error yang terstruktur.

```rust
pub enum WazekoError {
    Connection(ConnectionError),
    Authentication(AuthenticationError),
    Protocol(ProtocolError),
    Session(SessionError),
    Message(MessageError),
    Media(MediaError),
}
```

Pengguna library dapat menangani error secara spesifik.

---

# 16. Project Structure

Struktur repository yang saya rekomendasikan:

```text
wazeko/
│
├── crates/
│   │
│   ├── wazeko/
│   │   ├── src/
│   │   │   ├── client.rs
│   │   │   ├── config.rs
│   │   │   ├── events.rs
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── wazeko-core/
│   │   ├── src/
│   │   │   ├── protocol/
│   │   │   ├── session/
│   │   │   ├── device/
│   │   │   └── error.rs
│   │   └── Cargo.toml
│   │
│   ├── wazeko-transport/
│   │   ├── src/
│   │   │   ├── websocket.rs
│   │   │   └── reconnect.rs
│   │   └── Cargo.toml
│   │
│   ├── wazeko-auth/
│   │   ├── src/
│   │   │   ├── qr.rs
│   │   │   ├── pairing.rs
│   │   │   └── store.rs
│   │   └── Cargo.toml
│   │
│   └── wazeko-types/
│       ├── src/
│       │   ├── message.rs
│       │   ├── contact.rs
│       │   ├── group.rs
│       │   └── jid.rs
│       └── Cargo.toml
│
├── examples/
├── tests/
├── docs/
├── Cargo.toml
├── Cargo.lock
├── README.md
├── LICENSE
└── CHANGELOG.md
```

### Workspace

Root `Cargo.toml` menggunakan Cargo Workspace:

```toml
[workspace]
members = [
    "crates/wazeko",
    "crates/wazeko-core",
    "crates/wazeko-transport",
    "crates/wazeko-auth",
    "crates/wazeko-types"
]
resolver = "2"
```

---

# 17. MVP — Wazeko v0.1

Versi pertama **jangan langsung membuat semua fitur WhatsApp**.

Prioritas:

### Milestone 1 — Core

* [ ] Rust workspace
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
cargo add wazeko
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

```rust
use wazeko::Wazeko;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = Wazeko::builder()
        .auth_store("./auth")
        .build();

    client.connect().await?;

    let mut events = client.events();

    while let Some(event) = events.recv().await {
        println!("{event:?}");
    }

    Ok(())
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
 └── Production-ready Rust Library
```

## 20. Positioning

**Wazeko** bukan sekadar bot WhatsApp. Positioning yang lebih kuat:

> **Wazeko — A Rust-native asynchronous WhatsApp Web client library.**

Tagline alternatif:

> **Fast. Async. Rust-native.**

atau:

> **WhatsApp Web connectivity, powered by Rust.**

Dengan positioning ini, **Rust menjadi identitas utama Wazeko**, sementara WebSocket, binary protocol, QR/Pairing Code, dan Multi-Device menjadi fondasi teknologinya.
