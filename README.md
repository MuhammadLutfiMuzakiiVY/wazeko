# Wazeko

> **Wazeko — A Rust-native asynchronous WhatsApp Web client library.**
>
> *Fast. Async. Rust-native.*

[![License](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](#license)
[![Rust](https://img.shields.io/badge/rust-1.75%2B-orange.svg)](https://www.rust-lang.org)

**Wazeko** is a modular, high-performance, asynchronous WhatsApp Web client library built from the ground up in Rust using Tokio and type-safe abstractions.

---

## ⚡ Features

- **Asynchronous Architecture**: Built on Tokio runtime and non-blocking I/O.
- **WebSocket Transport**: High-throughput duplex WebSocket abstraction with auto-reconnection and exponential backoff.
- **Binary Codec & Framing**: Low-allocation binary protocol encoder, decoder, and token lookup.
- **Authentication**: QR Code rendering in terminal and 8-character Pairing Code challenge support.
- **Session Persistence**: Extensible `AuthStore` supporting file-based JSON storage, in-memory store, or custom storage engines.
- **Event-Driven**: Channel-based event streams for connection lifecycle, incoming messages, receipts, and group changes.
- **Ergonomic Messaging**: Clean builder APIs for sending text, replies, media, and reactions.

---

## 📦 Workspace Crates

| Crate | Description |
|---|---|
| [`wazeko`](crates/wazeko) | Main client facade, builder API, event dispatcher, high-level messaging |
| [`wazeko-core`](crates/wazeko-core) | Binary protocol encoder/decoder, framing, device identities, session error types |
| [`wazeko-transport`](crates/wazeko-transport) | WebSocket transport abstraction (`Socket` trait), reconnection manager |
| [`wazeko-auth`](crates/wazeko-auth) | QR Code generator, pairing code logic, `AuthStore` traits (`FileAuthStore`, `MemoryAuthStore`) |
| [`wazeko-types`](crates/wazeko-types) | Domain primitives: `Jid`, `Message`, `MessageContent`, `Event`, `GroupMetadata` |

---

## 🚀 Getting Started

Add Wazeko to your `Cargo.toml`:

```toml
[dependencies]
wazeko = { path = "crates/wazeko" }
tokio = { version = "1.38", features = ["full"] }
```

### Basic Example

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
            _ => {}
        }
    }

    Ok(())
}
```

### Pairing Code Example

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
            println!("Enter code on your phone: {}", code_event.code);
        }
    }

    Ok(())
}
```

### Sending Messages & Replies

```rust
use wazeko::{Jid, MessageContent, Wazeko};

async fn send_demo(client: &Wazeko) -> Result<(), Box<dyn std::error::Error>> {
    let recipient = Jid::user("6281234567890");

    // Send text message
    let msg = client.send_message(recipient, MessageContent::Text("Hello from Wazeko in Rust!".into())).await?;

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

## 📄 License

Dual-licensed under either of:

- MIT License ([LICENSE-MIT](LICENSE) or http://opensource.org/licenses/MIT)
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE) or http://www.apache.org/licenses/LICENSE-2.0)
