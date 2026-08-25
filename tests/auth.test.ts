import test from "node:test";
import assert from "node:assert/strict";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { MemoryAuthStore, FileAuthStore } from "../packages/wazeko-auth/src/store.js";
import { QrCodeManager } from "../packages/wazeko-auth/src/qr.js";
import { PairingCodeManager } from "../packages/wazeko-auth/src/pairing.js";
import { initCredentials } from "../packages/wazeko-core/src/session.js";
import { parseJid } from "../packages/wazeko-types/src/jid.js";

test("Auth Store: MemoryAuthStore lifecycle", async () => {
  const store = new MemoryAuthStore();
  assert.equal(await store.load(), null);

  const creds = initCredentials();
  creds.registered = true;
  creds.me = parseJid("628123456789@s.whatsapp.net");
  await store.save(creds);

  const loaded = await store.load();
  assert.ok(loaded);
  assert.equal(loaded.registered, true);
  assert.equal(loaded.me?.user, "628123456789");

  await store.clear();
  assert.equal(await store.load(), null);
});

test("Auth Store: FileAuthStore disk persistence lifecycle", async () => {
  const tempDir = path.join(os.tmpdir(), `wazeko_test_auth_${Date.now()}`);
  const store = new FileAuthStore(tempDir);

  try {
    assert.equal(await store.load(), null);

    const creds = initCredentials();
    creds.registered = true;
    creds.clientId = "TEST_CLIENT_ID_12345";
    await store.save(creds);

    // Verify file exists on disk
    const credsFilePath = path.join(tempDir, "credentials.json");
    const fileExists = await fs.stat(credsFilePath).then(() => true).catch(() => false);
    assert.equal(fileExists, true);

    // Reload from file store
    const reloaded = await store.load();
    assert.ok(reloaded);
    assert.equal(reloaded.registered, true);
    assert.equal(reloaded.clientId, "TEST_CLIENT_ID_12345");

    // Clear credentials
    await store.clear();
    assert.equal(await store.load(), null);
  } finally {
    // Cleanup temporary directory
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

test("Pairing Code: Generation format (4-4 alphanumeric) and expiration", () => {
  const pairingMgr = new PairingCodeManager();
  const event = pairingMgr.generateCode(180);
  assert.ok(event.code);
  assert.equal(event.expiresInSeconds, 180);

  // Validate format: 4 chars - 4 chars (e.g. ABCD-1234)
  const pattern = /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  assert.ok(pattern.test(event.code), `Pairing code '${event.code}' should match 8-char pattern`);
  
  const current = pairingMgr.current;
  assert.ok(current);
  assert.equal(current.code, event.code);

  const event2 = pairingMgr.generateCode(60);
  assert.ok(event2.code);
  assert.equal(event2.expiresInSeconds, 60);
});

test("QR Code: Manager state tracking and attempts", () => {
  const qrMgr = new QrCodeManager();
  const qr1 = qrMgr.updateQr("2@challenge_string_1", 1, 60);
  assert.equal(qr1.raw, "2@challenge_string_1");
  assert.equal(qr1.attempts, 1);
  assert.equal(qr1.timeoutSeconds, 60);

  const current1 = qrMgr.current;
  assert.ok(current1);
  assert.equal(current1.raw, "2@challenge_string_1");

  const qr2 = qrMgr.updateQr("2@challenge_string_2", 2, 60);
  assert.equal(qr2.attempts, 2);

  const current2 = qrMgr.current;
  assert.ok(current2);
  assert.equal(current2.attempts, 2);
});
