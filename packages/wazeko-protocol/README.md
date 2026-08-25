# `@wazeko/protocol`

WhatsApp binary protocol encoder, decoder, single-byte token dictionaries, and node tree structures (`ProtocolNode`) for **Wazeko**.

---

## 📦 Features

- **Binary Codec**: High-throughput binary encoder and decoder (~180k ops/sec) with full protection against malformed or truncated buffers.
- **Token Dictionary**: WhatsApp single-byte static dictionary lookup and reverse resolution for bandwidth optimization.
- **`ProtocolNodeBuilder`**: Fluent builder pattern for constructing structured protocol stanzas:

```ts
import { ProtocolNodeBuilder } from "@wazeko/protocol";

const node = ProtocolNodeBuilder.create("message")
  .attr("id", "3EB0ABC123")
  .attr("to", "628123456789@s.whatsapp.net")
  .attr("type", "text")
  .build();
```
