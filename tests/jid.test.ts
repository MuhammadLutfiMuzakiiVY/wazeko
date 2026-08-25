import test from "node:test";
import assert from "node:assert/strict";
import { parseJid, jidToString, isJidGroup, isJidUser } from "../packages/wazeko-types/src/jid.js";

test("JID Parsing: user jid", () => {
  const jid = parseJid("628123456789@s.whatsapp.net");
  assert.equal(jid.user, "628123456789");
  assert.equal(jid.server, "s.whatsapp.net");
  assert.equal(isJidUser(jid), true);
  assert.equal(isJidGroup(jid), false);
  assert.equal(jidToString(jid), "628123456789@s.whatsapp.net");
});

test("JID Parsing: group jid", () => {
  const jid = parseJid("1203630248234@g.us");
  assert.equal(jid.user, "1203630248234");
  assert.equal(jid.server, "g.us");
  assert.equal(isJidGroup(jid), true);
});

test("JID Parsing: device jid", () => {
  const jid = parseJid("628123456789:2@s.whatsapp.net");
  assert.equal(jid.user, "628123456789");
  assert.equal(jid.device, 2);
  assert.equal(jidToString(jid), "628123456789:2@s.whatsapp.net");
});
