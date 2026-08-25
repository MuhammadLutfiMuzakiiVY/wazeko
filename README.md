<p align="center">
  <img src="assets/logo.png" alt="Wazeko Logo" width="480"/>
</p>

<h1 align="center">Wazeko</h1>

<p align="center">
  <strong>Fast. Async. Rust-native.</strong><br>
  <em>A modular, high-performance WhatsApp Web client library built from the ground up in Rust.</em>
</p>

<p align="center">
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/wazeko/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"></a>
  <a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/rust-1.75%2B-orange.svg?logo=rust" alt="Rust 1.75+"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg" alt="License"></a>
  <a href="https://tokio.rs"><img src="https://img.shields.io/badge/async-tokio-blueviolet.svg?logo=tokio" alt="Tokio Async"></a>
  <a href="https://github.com/MuhammadLutfiMuzakiiVY/wazeko/stargazers"><img src="https://img.shields.io/github/stars/MuhammadLutfiMuzakiiVY/wazeko?style=flat&color=yellow" alt="GitHub Stars"></a>
</p>

---

## 📖 About Wazeko

**Wazeko** is an open-source, asynchronous client library for WhatsApp Web written entirely in **Rust**. Built on top of the **Tokio** asynchronous runtime and **tokio-tungstenite** WebSocket transport, Wazeko provides high-throughput, low-latency, and memory-efficient communication with WhatsApp's multi-device servers.

### 🌟 Why Wazeko?

- **🦀 Pure Rust Performance**: Eliminates the heavy memory footprint and runtime overhead of JavaScript/Node.js alternatives.
- **🔒 Type Safety & Robustness**: Compile-time verification for JIDs, message types, and binary protocol packets.
- **⚡ Asynchronous by Design**: Non-blocking I/O with Tokio broadcast event channels for scalable concurrency and event streaming.
- **🧩 Decoupled Modular Architecture**: Clean separation between transport layer, binary codec, authentication strategies, and high-level messaging.
- **🔄 Resilient Reconnection**: Built-in exponential backoff reconnection manager for continuous production uptime.

---

## 🏛️ Layered Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    Wazeko Application                     │
├───────────────────────────────────────────────────────────┤
│             Public API (Builder & Event Stream)           │
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

## ⚡ Core Features

- **🚀 Async WebSocket Transport**: High-throughput duplex WebSocket abstraction with auto-reconnection and exponential backoff.
- **📦 Binary Protocol & Codec**: Low-allocation binary node encoder, decoder, and token dictionary lookup table.
- **📱 Authentication Modes**:
  - **Terminal QR Code**: Auto-renders high-contrast ANSI Unicode QR codes directly in your terminal.
  - **Pairing Code**: 8-character pairing code challenge format (`ABCD-1234`) for phone number registration.
- **💾 Extensible Session Storage**: `AuthStore` trait with built-in `FileAuthStore` (JSON persistence), `MemoryAuthStore`, or custom database storage.
- **📡 Event-Driven Stream**: Channel-based event streams (`ConnectionUpdate`, `Qr`, `PairingCode`, `Message`, `MessageReceipt`, `GroupUpdate`).
- **💬 Ergonomic Messaging**: Send text, replies, quotes, reactions, documents, and media attachments.

---

## 📦 Workspace Crates

Wazeko is organized as a unified Cargo Workspace with specialized, loosely coupled crates:

| Crate | Version | Description |
|---|---|---|
| [`wazeko`](crates/wazeko) | `0.1.0` | Main client facade, builder API, event dispatcher, high-level messaging |
| [`wazeko-core`](crates/wazeko-core) | `0.1.0` | Binary protocol encoder/decoder, framing, device identities, session error types |
| [`wazeko-transport`](crates/wazeko-transport) | `0.1.0` | WebSocket transport abstraction (`Socket` trait), reconnection manager |
| [`wazeko-auth`](crates/wazeko-auth) | `0.1.0` | QR Code generator, pairing code logic, `AuthStore` traits (`FileAuthStore`, `MemoryAuthStore`) |
| [`wazeko-types`](crates/wazeko-types) | `0.1.0` | Domain primitives: `Jid`, `Message`, `MessageContent`, `Event`, `GroupMetadata` |

---

## 🚀 Getting Started

Add Wazeko to your `Cargo.toml`:

```toml
[dependencies]
wazeko = { git = "https://github.com/MuhammadLutfiMuzakiiVY/wazeko.git" }
tokio = { version = "1.38", features = ["full"] }
```

### 1. Basic Connection & Event Loop

```rust
use wazeko::{Event, Wazeko};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // 1. Build Wazeko client
    let client = Wazeko::builder()
        .auth_store("./auth")
        .print_qr(true)
        .build();

    // 2. Connect to WhatsApp Web
    client.connect().await?;

    // 3. Listen to event stream
    let mut events = client.events();
    while let Some(event) = events.recv().await {
        match event {
            Event::ConnectionUpdate(state) => println!("Connection state: {state:?}"),
            Event::Message(msg) => println!("New message from {}: {:?}", msg.source.chat, msg.content),
            Event::Authenticated { user_jid } => println!("Logged in as: {user_jid}"),
            _ => {}
        }
    }

    Ok(())
}
```

### 2. Login via Pairing Code

```rust
use wazeko::{Event, Wazeko};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Wazeko::builder()
        .auth_store("./auth")
        .pairing_phone_number("6281234567890")
        .build();

    client.connect().await?;
    let mut events = client.events();

    while let Some(event) = events.recv().await {
        if let Event::PairingCode(code_event) = event {
            println!("Enter this code on your phone: {}", code_event.code);
        }
    }

    Ok(())
}
```

### 3. Sending Messages & Replies

```rust
use wazeko::{Jid, MessageContent, Wazeko};

async fn send_demo(client: &Wazeko) -> Result<(), Box<dyn std::error::Error>> {
    let recipient = Jid::user("6281234567890");

    // Send text message
    let msg = client
        .send_message(recipient, MessageContent::Text("Hello from Wazeko in Rust!".into()))
        .await?;

    // Reply to message
    client.reply(&msg, "Replying to earlier message").await?;

    Ok(())
}
```

---

## 🧪 Testing & Verification

Run tests across the entire workspace:

```bash
cargo test --workspace
```

Run examples:

```bash
cargo run --example basic_client -p wazeko
cargo run --example qr_login -p wazeko
cargo run --example pairing_login -p wazeko
cargo run --example echo_bot -p wazeko
```

---

## 🗺️ Roadmap

- [x] **v0.1.0 — Foundation**: WebSocket transport, binary framing codec, QR Code rendering, Pairing Code, Session store, event channel.
- [ ] **v0.2.0 — Multi-Device & Encryption**: End-to-end Signal protocol handshake, pre-key rotation, full cipher pipeline.
- [ ] **v0.3.0 — Media & Groups**: Media encryption/upload/download, group administration APIs, community support.
- [ ] **v0.4.0 — Performance & Hardening**: Connection pooling, benchmark test suites, fuzz testing.
- [ ] **v1.0.0 — Production Ready**: Full API stability, documentation on docs.rs, published to crates.io.

---

## 📄 License

Dual-licensed under either of:

- **MIT License** ([LICENSE-MIT](LICENSE) or http://opensource.org/licenses/MIT)
- **Apache License, Version 2.0** ([LICENSE-APACHE](LICENSE) or http://www.apache.org/licenses/LICENSE-2.0)
