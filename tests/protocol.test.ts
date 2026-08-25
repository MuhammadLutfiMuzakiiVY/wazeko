import test from "node:test";
import assert from "node:assert/strict";
import { BinaryEncoder } from "../packages/wazeko-protocol/src/encoder.js";
import { BinaryDecoder } from "../packages/wazeko-protocol/src/decoder.js";
import { ProtocolNodeBuilder, getChildNode } from "../packages/wazeko-protocol/src/node.js";

test("Binary Codec: Encode and Decode roundtrip", () => {
  const node = ProtocolNodeBuilder.create("iq")
    .attr("id", "12345")
    .attr("type", "get")
    .attr("to", "s.whatsapp.net")
    .build();

  const encoder = new BinaryEncoder();
  const bytes = encoder.encode(node);
  assert.ok(bytes.length > 0);

  const decoded = BinaryDecoder.decode(bytes);
  assert.equal(decoded.tag, "iq");
  assert.equal(decoded.attrs["id"], "12345");
  assert.equal(decoded.attrs["type"], "get");
  assert.equal(decoded.attrs["to"], "s.whatsapp.net");
});

test("Binary Codec: Nested nodes roundtrip", () => {
  const child = ProtocolNodeBuilder.create("ping").build();
  const parent = ProtocolNodeBuilder.create("iq")
    .attr("id", "ping-1")
    .contentNodes([child])
    .build();

  const encoder = new BinaryEncoder();
  const bytes = encoder.encode(parent);

  const decoded = BinaryDecoder.decode(bytes);
  assert.equal(decoded.tag, "iq");
  const childNode = getChildNode(decoded, "ping");
  assert.ok(childNode);
  assert.equal(childNode.tag, "ping");
});
