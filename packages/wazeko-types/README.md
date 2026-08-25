# `@wazeko/types`

Strict domain types, JID primitives, Message schemas, and Event structures for **Wazeko**.

---

## 📦 Features

- **JID Primitives**: Strongly typed JID structures supporting users (`@s.whatsapp.net`), groups (`@g.us`), newsletters/channels (`@newsletter`), broadcasts (`@broadcast`), and compound device/agent addresses.
  - `parseJid(str: string): Jid`
  - `jidUser(phoneNumber: string): Jid`
  - `jidGroup(groupId: string): Jid`
  - `jidToString(jid: Jid): string`
  - `isJidGroup(jid: Jid): boolean`
  - `isJidUser(jid: Jid): boolean`
- **Message Primitives**: Discriminated union types for text, image, video, audio/PTT, document, reply, and reaction payloads.
- **Event Maps**: Fully typed event dictionary (`connection.update`, `qr`, `pairing.code`, `authenticated`, `message`, `disconnect`).
