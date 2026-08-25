import test from "node:test";
import assert from "node:assert/strict";
import { BinaryEncoder } from "../packages/wazeko-protocol/src/encoder.js";
import { BinaryDecoder } from "../packages/wazeko-protocol/src/decoder.js";
import {
  ProtocolNodeBuilder,
  getChildNode,
  getChildrenNodes,
} from "../packages/wazeko-protocol/src/node.js";
import { getToken, getTokenIndex } from "../packages/wazeko-protocol/src/tokens.js";

test("Tokens: Table index lookup & reverse resolution", () => {
  assert.equal(getToken(3), "s.whatsapp.net");
  assert.equal(getToken(29), "message");
  assert.equal(getToken(46), "iq");
  assert.equal(getToken(47), "ping");

  assert.equal(getTokenIndex("s.whatsapp.net"), 3);
  assert.equal(getTokenIndex("message"), 29);
  assert.equal(getTokenIndex("iq"), 46);
  assert.equal(getTokenIndex("ping"), 47);
  assert.equal(getTokenIndex("non_existent_token_123"), undefined);
});

test("Binary Codec: Basic node encode/decode", () => {
  const node = ProtocolNodeBuilder.create("iq")
    .attr("id", "3EB0ABC123")
    .attr("type", "get")
    .attr("to", "s.whatsapp.net")
    .build();

  const encoder = new BinaryEncoder();
  const bytes = encoder.encode(node);
  assert.ok(bytes.length > 0);

  const decoded = BinaryDecoder.decode(bytes);
  assert.equal(decoded.tag, "iq");
  assert.equal(decoded.attrs["id"], "3EB0ABC123");
  assert.equal(decoded.attrs["type"], "get");
  assert.equal(decoded.attrs["to"], "s.whatsapp.net");
});

test("Binary Codec: Small binary payload (< 256 bytes TAG_BINARY_8)", () => {
  const payload = new TextEncoder().encode("Hello Binary WhatsApp");
  const node = ProtocolNodeBuilder.create("message")
    .attr("id", "msg-1")
    .contentBytes(payload)
    .build();

  const encoder = new BinaryEncoder();
  const bytes = encoder.encode(node);

  const decoded = BinaryDecoder.decode(bytes);
  assert.equal(decoded.tag, "message");
  assert.ok(decoded.content instanceof Uint8Array);
  assert.deepEqual(decoded.content, payload);
});

test("Binary Codec: Large binary payload (> 256 bytes TAG_BINARY_32)", () => {
  // 1024 bytes binary payload
  const largePayload = new Uint8Array(1024);
  for (let i = 0; i < 1024; i++) {
    largePayload[i] = i % 256;
  }

  const node = ProtocolNodeBuilder.create("media")
    .attr("type", "image")
    .contentBytes(largePayload)
    .build();

  const encoder = new BinaryEncoder();
  const bytes = encoder.encode(node);

  const decoded = BinaryDecoder.decode(bytes);
  assert.equal(decoded.tag, "media");
  assert.ok(decoded.content instanceof Uint8Array);
  assert.equal(decoded.content.length, 1024);
  assert.deepEqual(decoded.content, largePayload);
});

test("Binary Codec: Multi-level deeply nested tree & multiple children", () => {
  const item1 = ProtocolNodeBuilder.create("item").attr("id", "1").build();
  const item2 = ProtocolNodeBuilder.create("item").attr("id", "2").build();
  const listNode = ProtocolNodeBuilder.create("query")
    .attr("type", "contacts")
    .contentNodes([item1, item2])
    .build();

  const rootNode = ProtocolNodeBuilder.create("iq")
    .attr("id", "query-1")
    .attr("type", "result")
    .contentNodes([listNode])
    .build();

  const encoder = new BinaryEncoder();
  const bytes = encoder.encode(rootNode);

  const decoded = BinaryDecoder.decode(bytes);
  assert.equal(decoded.tag, "iq");

  const queryChild = getChildNode(decoded, "query");
  assert.ok(queryChild);
  assert.equal(queryChild.tag, "query");

  const items = getChildrenNodes(queryChild, "item");
  assert.equal(items.length, 2);
  assert.equal(items[0].attrs["id"], "1");
  assert.equal(items[1].attrs["id"], "2");
});

test("Binary Codec: Error handling on malformed or truncated buffer", () => {
  // Empty buffer
  assert.throws(() => BinaryDecoder.decode(new Uint8Array([])), /Unexpected EOF/);

  // Truncated list header
  assert.throws(() => BinaryDecoder.decode(new Uint8Array([0x01])), /Unexpected EOF/);

  // Corrupted header tag
  assert.throws(() => BinaryDecoder.decode(new Uint8Array([0xff, 0x01])), /Invalid list tag header/);
});
