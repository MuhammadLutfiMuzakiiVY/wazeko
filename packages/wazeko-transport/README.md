# `@wazeko/transport`

WebSocket transport abstractions, framed TLS duplex streaming, and connection resilience for **Wazeko**.

---

## 📦 Features

- **`WebSocketTransport`**: Robust WebSocket client wrapped in the `Socket` interface.
- **`ReconnectManager`**: Predictable connection recovery with exponential backoff algorithms, jitter calculation, and configurable max retry caps.
- **Connection Lifecycle State Tracking**: `disconnected` ➔ `connecting` ➔ `authenticating` ➔ `connected`.
