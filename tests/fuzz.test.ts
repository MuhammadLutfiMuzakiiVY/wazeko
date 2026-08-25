import test from "node:test";
import assert from "node:assert/strict";
import { BinaryEncoder } from "../packages/wazeko-protocol/src/encoder.js";
import { BinaryDecoder } from "../packages/wazeko-protocol/src/decoder.js";
import { ProtocolNodeBuilder } from "../packages/wazeko-protocol/src/node.js";
import { parseJid } from "../packages/wazeko-types/src/jid.js";
import { decryptMedia } from "../packages/wazeko-core/src/media.js";

test("Fuzz Testing: Protocol Binary Decoder robustness against random byte corruption", () => {
  const encoder = new BinaryEncoder();
  const sampleNode = ProtocolNodeBuilder.create("message")
    .attr("id", "3EB0FUZZ123")
    .attr("to", "628123456789@s.whatsapp.net")
    .contentBytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))
    .build();

  const originalBytes = encoder.encode(sampleNode);

  // Run 500 fuzz iterations with random byte flips and truncations
  for (let i = 0; i < 500; i++) {
    const fuzzed = new Uint8Array(originalBytes);
    // Random mutation: flip a byte or truncate
    const mutationType = i % 3;
    if (mutationType === 0) {
      const idx = Math.floor(Math.random() * fuzzed.length);
      fuzzed[idx] = Math.floor(Math.random() * 256);
    } else if (mutationType === 1) {
      const sliceLen = Math.floor(Math.random() * fuzzed.length);
      const truncated = fuzzed.subarray(0, sliceLen);
      // Fuzz decoder should either return valid node or throw structured error, NEVER unhandled crash
      try {
        BinaryDecoder.decode(truncated);
      } catch (err: any) {
        assert.ok(err instanceof Error);
      }
      continue;
    }

    try {
      BinaryDecoder.decode(fuzzed);
    } catch (err: any) {
      assert.ok(err instanceof Error);
    }
  }
});

test("Fuzz Testing: JID parser with arbitrary random input and unicode", () => {
  const fuzzInputs = [
    "",
    "   ",
    "@",
    "@@@",
    "user@",
    "@s.whatsapp.net",
    "user@g.us@s.whatsapp.net",
    "✨🎉🔥@s.whatsapp.net",
    "12345:abc@s.whatsapp.net",
    "12345_xyz:99@s.whatsapp.net",
    "a".repeat(1000) + "@s.whatsapp.net",
    "\0\0\0@s.whatsapp.net",
  ];

  for (const input of fuzzInputs) {
    try {
      const jid = parseJid(input);
      assert.ok(jid.server);
    } catch (err: any) {
      assert.ok(err instanceof Error);
    }
  }
});

test("Fuzz Testing: Media decryptor with random payloads", () => {
  const dummyKey = new Uint8Array(32);
  for (let i = 0; i < 50; i++) {
    const randomLength = Math.floor(Math.random() * 100);
    const randomPayload = new Uint8Array(randomLength);
    try {
      decryptMedia(randomPayload, dummyKey, "image");
    } catch (err: any) {
      assert.ok(err instanceof Error);
    }
  }
});
