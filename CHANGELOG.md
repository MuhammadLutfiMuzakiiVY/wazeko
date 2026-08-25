# Changelog

All notable changes to the Wazeko project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-25

### Added
- **Signal Protocol Engine (`@wazeko/core`)**:
  - Pre-Key Bundle generation and rotation (`PreKeyManager`, `generateInitialPreKeys`, `rotateSignedPreKey`).
  - Signal Protocol Double Ratchet session cipher (`SignalSession`, `SignalSessionStore`) for E2EE messages.
- **Noise Protocol Handshake (`@wazeko/core`)**:
  - Full `Noise_XX_25519_AESGCM_SHA256` state machine (`NoiseHandshake`).
  - `FrameCipher` for duplex encrypted WebSocket streaming.
- **Media Cryptography Pipeline (`@wazeko/core`)**:
  - HKDF media key derivation (`deriveMediaKeys`) for images, videos, audio, documents, and stickers.
  - Streaming AES-256-CBC cipher with 10-byte truncated HMAC-SHA256 integrity validation (`encryptMedia`, `decryptMedia`).
- **Group Administration API (`wazeko`)**:
  - Complete group operations: `create`, `info`, `updateSubject`, `updateDescription`, `addParticipants`, `removeParticipants`, `promoteParticipants`, `demoteParticipants`, `getInviteCode`, `joinWithCode`, `leave`.
- **Fuzz Testing & Benchmark Suite**:
  - Fuzz tests for random byte flip resistance on binary protocol frames, JID parser, and media decryptor (`tests/fuzz.test.ts`).
  - High-throughput benchmark suite achieving **>181,000 decode ops/sec** (`benchmarks/protocol-bench.ts`).
- **Full Test Suite**: 34 unit, integration, and fuzz tests passing with 100% success rate.
