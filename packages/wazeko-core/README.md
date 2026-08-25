# `@wazeko/core`

Cryptographic foundations, Signal Protocol implementations, Noise Protocol handshakes, and media encryption pipelines for **Wazeko**.

---

## 📦 Features

### 1. Signal Protocol & PreKey Bundle Management
- `generateKeyPair()`: Curve25519 / X25519 key generation.
- `PreKeyManager`: Generates and rotates identity keys, signed prekeys, and one-time prekeys.
- `SessionCipher`: Manages end-to-end encrypted sessions and ratcheting per remote WhatsApp JID.

### 2. Noise XX Protocol Handshake & FrameCipher
- Full Noise XX state machine with ephemeral key exchange and static identity authentication.
- `FrameCipher`: Streaming AES-256-GCM framing cipher for raw binary WebSocket frames.

### 3. Media Cryptography (HKDF, AES-CBC, HMAC Verification)
- Derives separate `iv`, `cipherKey`, `macKey`, and `refKey` per media type (`image`, `video`, `audio`, `document`, `sticker`).
- Validates 10-byte truncated HMAC-SHA256 checksums to reject tampered or corrupted media downloads.
- `encryptMedia()` and `decryptMedia()` primitives.
