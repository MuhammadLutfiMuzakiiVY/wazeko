# Changelog

All notable changes to the Wazeko project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-25

### Added
- Complete TypeScript & Node.js monorepo architecture aligned with `Wazeko_Product_Requirements_Document_Updated.md`.
- `@wazeko/types`: JID parser/validator (`user@s.whatsapp.net`, `group@g.us`, `lid`, `broadcast`), Message & MessageContent models, Event maps, Contact, GroupMetadata.
- `@wazeko/protocol`: Binary protocol framing encoder, decoder, single-byte token dictionary, ProtocolNode tree builder, and WAProto Protocol Buffers schema definitions.
- `@wazeko/core`: Typed error taxonomy (`WazekoError`, `ConnectionError`, `AuthenticationError`, `ProtocolError`, `SessionError`, `MessageError`), DeviceIdentity, and session Credentials models.
- `@wazeko/transport`: Asynchronous WebSocket transport with `ws`, event listeners, `Socket` interface, and `ReconnectManager` exponential backoff.
- `@wazeko/auth`: `AuthStore` abstraction (`FileAuthStore` JSON persistence & `MemoryAuthStore`), ANSI terminal QR Code generator (`qrcode-terminal`), and 8-character Pairing Code challenge generator (`ABCD-1234`).
- `wazeko`: Main client façade, `WazekoBuilder`, async event iterators (`for await (const event of client.events())`), EventEmitter (`client.on`), Messaging API, and Group management.
- Complete TypeScript test suite with 100% pass rate under `node --test`.
- Runnable examples in `examples/` (`basic-client.ts`, `qr-login.ts`, `pairing-login.ts`, `echo-bot.ts`).
