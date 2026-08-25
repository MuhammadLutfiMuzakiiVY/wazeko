import test from "node:test";
import assert from "node:assert/strict";
import {
  parseJid,
  jidToString,
  jidUser,
  jidGroup,
  isJidGroup,
  isJidUser,
} from "../packages/wazeko-types/src/jid.js";

test("JID: Standard User JID parsing & stringify", () => {
  const jid = parseJid("628123456789@s.whatsapp.net");
  assert.equal(jid.user, "628123456789");
  assert.equal(jid.server, "s.whatsapp.net");
  assert.equal(jid.device, undefined);
  assert.equal(jid.agent, undefined);
  assert.equal(isJidUser(jid), true);
  assert.equal(isJidGroup(jid), false);
  assert.equal(jidToString(jid), "628123456789@s.whatsapp.net");
});

test("JID: Group JID parsing", () => {
  const jid = parseJid("1203630248234@g.us");
  assert.equal(jid.user, "1203630248234");
  assert.equal(jid.server, "g.us");
  assert.equal(isJidGroup(jid), true);
  assert.equal(isJidUser(jid), false);
  assert.equal(jidToString(jid), "1203630248234@g.us");
});

test("JID: Device and Agent compound parsing", () => {
  const jidWithDevice = parseJid("628123456789:3@s.whatsapp.net");
  assert.equal(jidWithDevice.user, "628123456789");
  assert.equal(jidWithDevice.device, 3);
  assert.equal(jidToString(jidWithDevice), "628123456789:3@s.whatsapp.net");

  const jidWithAgent = parseJid("628123456789_1@s.whatsapp.net");
  assert.equal(jidWithAgent.user, "628123456789");
  assert.equal(jidWithAgent.agent, 1);
  assert.equal(jidToString(jidWithAgent), "628123456789_1@s.whatsapp.net");

  const jidCompound = parseJid("628123456789_2:4@s.whatsapp.net");
  assert.equal(jidCompound.user, "628123456789");
  assert.equal(jidCompound.agent, 2);
  assert.equal(jidCompound.device, 4);
  assert.equal(jidToString(jidCompound), "628123456789_2:4@s.whatsapp.net");
});

test("JID: Specialized servers (broadcast, newsletter, lid)", () => {
  const broadcastJid = parseJid("status@broadcast");
  assert.equal(broadcastJid.server, "broadcast");
  assert.equal(jidToString(broadcastJid), "status@broadcast");

  const newsletterJid = parseJid("120363123456@newsletter");
  assert.equal(newsletterJid.server, "newsletter");

  const lidJid = parseJid("9876543210@lid");
  assert.equal(lidJid.server, "lid");
});

test("JID: Helper constructors (jidUser & jidGroup)", () => {
  const user = jidUser("+62 812-3456-7890");
  assert.equal(user.user, "6281234567890");
  assert.equal(user.server, "s.whatsapp.net");

  const group = jidGroup("1203630248234");
  assert.equal(group.user, "1203630248234");
  assert.equal(group.server, "g.us");
});

test("JID: Error cases & invalid input validation", () => {
  assert.throws(() => parseJid(""), /Empty JID string/);
  assert.throws(() => parseJid("   "), /Empty JID string/);
  assert.throws(() => parseJid("invalid-jid-without-server"), /Invalid JID format/);
  assert.throws(() => parseJid("too@many@at@signs"), /Invalid JID format/);
});
