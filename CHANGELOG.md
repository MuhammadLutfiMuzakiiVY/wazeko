# Changelog

All notable changes to the Wazeko project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-25

### Added
- Initial project architecture and Cargo workspace definition.
- `wazeko-types`: JID parsing/validation, Message structures, Event system, Contact and Group models.
- `wazeko-core`: Binary protocol encoder, decoder, token dictionary, ProtocolNode tree representation, Session & Device states.
- `wazeko-transport`: Async WebSocket client with `Socket` trait and `ReconnectManager` exponential backoff.
- `wazeko-auth`: `AuthStore` trait with `FileAuthStore` and `MemoryAuthStore`, ANSI QR code generator, Pairing Code challenge manager.
- `wazeko`: Main facade client with `WazekoBuilder`, event receiver channels, messaging API, and examples.
