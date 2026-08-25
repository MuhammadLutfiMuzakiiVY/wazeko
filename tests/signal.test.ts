import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair } from "../packages/wazeko-core/src/crypto.js";
import { NoiseHandshake, FrameCipher } from "../packages/wazeko-core/src/noise.js";
import { PreKeyManager, SignalSession, SignalSessionStore } from "../packages/wazeko-core/src/signal.js";

test("Noise Protocol: Full Handshake & FrameCipher streaming roundtrip", () => {
  const clientIdentity = generateKeyPair();
  const serverIdentity = generateKeyPair();

  const clientHandshake = new NoiseHandshake(clientIdentity);
  const serverHandshake = new NoiseHandshake(serverIdentity);

  // 1. Client initiates (Message 1: e)
  const clientEphemeral = clientHandshake.initiateHandshake();
  assert.equal(clientEphemeral.length, 32);

  // 2. Server crafts server hello (Message 2: e, ee, s, es)
  const serverPayload = new TextEncoder().encode("SERVER_HELLO_PAYLOAD");
  const { serverEphemeral, serverPayloadEnc } = serverHandshake.craftServerHello(serverPayload);

  const decryptedServerPayload = clientHandshake.processServerHello(serverEphemeral, serverPayloadEnc);
  assert.deepEqual(decryptedServerPayload, serverPayload);

  // 3. Client finalizes (Message 3: s, se)
  const { clientFinish, cipherState: clientCipherState } = clientHandshake.finalizeHandshake();
  assert.ok(clientFinish.length > 0);
  assert.ok(clientHandshake.completed);

  // 4. FrameCipher bidirectional packet encryption
  const clientCipher = new FrameCipher(clientCipherState);
  const serverCipher = new FrameCipher({
    encKey: clientCipherState.decKey,
    decKey: clientCipherState.encKey,
    encCounter: 0n,
    decCounter: 0n,
  });

  const rawPacket = new TextEncoder().encode("<iq id='1' type='get'/>");
  const encryptedFrame = clientCipher.encryptFrame(rawPacket);
  assert.ok(encryptedFrame.length > rawPacket.length);

  const decryptedPacket = serverCipher.decryptFrame(encryptedFrame);
  assert.deepEqual(decryptedPacket, rawPacket);
});

test("Signal Protocol: PreKey generation, rotation & bundle manager", () => {
  const identityKeyPair = generateKeyPair();
  const preKeyManager = new PreKeyManager();

  // Initial 30 prekeys
  const preKeys = preKeyManager.generateInitialPreKeys(30);
  assert.equal(preKeys.length, 30);
  assert.ok(preKeyManager.getPreKey(1));
  assert.ok(preKeyManager.getPreKey(30));

  // Signed PreKey generation
  const signedPreKey1 = preKeyManager.generateSignedPreKey(identityKeyPair);
  assert.equal(signedPreKey1.keyId, 1);
  assert.ok(signedPreKey1.signature.length > 0);
  assert.ok(preKeyManager.getSignedPreKey(1));

  // Rotate Signed PreKey
  const signedPreKey2 = preKeyManager.rotateSignedPreKey(identityKeyPair);
  assert.equal(signedPreKey2.keyId, 2);
  assert.ok(preKeyManager.getSignedPreKey(2));
});

test("Signal Protocol: Session Cipher encrypt and decrypt roundtrip", () => {
  const sharedSecret = new Uint8Array(32).fill(7);
  const aliceSession = new SignalSession(sharedSecret);
  const bobSession = new SignalSession(sharedSecret);

  const plaintext = new TextEncoder().encode("Confidential E2EE WhatsApp message");
  const encrypted = aliceSession.encrypt(plaintext);

  assert.equal(encrypted.type, "pkmsg");
  assert.ok(encrypted.ciphertext.length > 0);

  const decrypted = bobSession.decrypt(encrypted);
  assert.deepEqual(decrypted, plaintext);

  // Subsequent message should ratchet to 'msg'
  const plaintext2 = new TextEncoder().encode("Second ratchet message");
  const encrypted2 = aliceSession.encrypt(plaintext2);
  assert.equal(encrypted2.type, "msg");

  const decrypted2 = bobSession.decrypt(encrypted2);
  assert.deepEqual(decrypted2, plaintext2);
});

test("Signal Protocol: Session Store tracking per remote JID", () => {
  const store = new SignalSessionStore();
  const session1 = store.getOrCreateSession("628123456789@s.whatsapp.net");
  const session2 = store.getOrCreateSession("628123456789@s.whatsapp.net");

  assert.equal(session1, session2);
});
