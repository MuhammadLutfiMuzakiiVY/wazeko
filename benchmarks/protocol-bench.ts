import { ProtocolNodeBuilder } from "../packages/wazeko-protocol/src/node.js";
import { BinaryEncoder } from "../packages/wazeko-protocol/src/encoder.js";
import { BinaryDecoder } from "../packages/wazeko-protocol/src/decoder.js";
import { generateKeyPair, sha256, aesGcmEncrypt, aesGcmDecrypt } from "../packages/wazeko-core/src/crypto.js";

async function runBenchmarks() {
  console.log("=== WAZEKO BENCHMARK SUITE (v0.4.0) ===\n");

  const ITERATIONS = 100_000;

  // 1. Binary Encoder / Decoder Benchmark
  const encoder = new BinaryEncoder();
  const sampleNode = ProtocolNodeBuilder.create("message")
    .attr("id", "3EB0123456789ABC")
    .attr("to", "628123456789@s.whatsapp.net")
    .attr("type", "text")
    .contentNodes([
      ProtocolNodeBuilder.create("conversation")
        .contentBytes(new TextEncoder().encode("Benchmark message content text"))
        .build(),
    ])
    .build();

  console.log(`[1] Protocol Binary Encoding/Decoding (${ITERATIONS.toLocaleString()} iterations)...`);
  const t0 = performance.now();
  let encodedBytes: Uint8Array = new Uint8Array(0);
  for (let i = 0; i < ITERATIONS; i++) {
    encodedBytes = encoder.encode(sampleNode);
  }
  const t1 = performance.now();
  const encodeOpsPerSec = Math.round((ITERATIONS / (t1 - t0)) * 1000);
  console.log(`    ↳ Encode: ${(t1 - t0).toFixed(2)}ms (${encodeOpsPerSec.toLocaleString()} ops/sec)`);

  const t2 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    BinaryDecoder.decode(encodedBytes);
  }
  const t3 = performance.now();
  const decodeOpsPerSec = Math.round((ITERATIONS / (t3 - t2)) * 1000);
  console.log(`    ↳ Decode: ${(t3 - t2).toFixed(2)}ms (${decodeOpsPerSec.toLocaleString()} ops/sec)`);

  // 2. Cryptographic Throughput Benchmark
  console.log(`\n[2] Cryptographic Hashing & AES-GCM (10,000 iterations)...`);
  const CRYPTO_ITERS = 10_000;
  const payload = new Uint8Array(1024); // 1KB
  for (let i = 0; i < 1024; i++) payload[i] = i % 256;

  const keyPair = generateKeyPair();
  const iv = new Uint8Array(12);

  const t4 = performance.now();
  for (let i = 0; i < CRYPTO_ITERS; i++) {
    sha256(payload);
  }
  const t5 = performance.now();
  console.log(`    ↳ SHA-256 (1KB): ${(t5 - t4).toFixed(2)}ms (${Math.round((CRYPTO_ITERS / (t5 - t4)) * 1000).toLocaleString()} ops/sec)`);

  const t6 = performance.now();
  for (let i = 0; i < CRYPTO_ITERS; i++) {
    const { ciphertext, tag } = aesGcmEncrypt(keyPair.privateKey, iv, payload);
    aesGcmDecrypt(keyPair.privateKey, iv, ciphertext, tag);
  }
  const t7 = performance.now();
  console.log(`    ↳ AES-GCM Encrypt+Decrypt (1KB): ${(t7 - t6).toFixed(2)}ms (${Math.round((CRYPTO_ITERS / (t7 - t6)) * 1000).toLocaleString()} ops/sec)`);

  console.log("\n========================================");
}

runBenchmarks().catch(console.error);
