import test from "node:test";
import assert from "node:assert/strict";
import { Wazeko } from "../packages/wazeko/src/client.js";
import { MemoryAuthStore } from "../packages/wazeko-auth/src/store.js";
import { ProtocolNode } from "../packages/wazeko-protocol/src/node.js";

test("Groups API: Create group with participants and owner admin", async () => {
  const store = new MemoryAuthStore();
  const client = Wazeko.builder().customAuthStore(store).build();

  const dispatchedNodes: ProtocolNode[] = [];
  // Hook client dispatch
  const originalDispatch = (client as any).dispatchNode.bind(client);
  (client as any).dispatchNode = async (node: ProtocolNode, msg: any) => {
    dispatchedNodes.push(node);
    return originalDispatch(node, msg);
  };

  const group = await client.groups.create("Test Developer Group", [
    "628123456789@s.whatsapp.net",
    "628987654321@s.whatsapp.net",
  ]);

  assert.equal(group.subject, "Test Developer Group");
  assert.equal(group.id.server, "g.us");
  assert.equal(group.participants.length, 2);
  assert.ok(dispatchedNodes.length > 0);
  assert.equal(dispatchedNodes[0].attrs["xmlns"], "w:g2");
});

test("Groups API: Subject, description, participant mutation and invite codes", async () => {
  const store = new MemoryAuthStore();
  const client = Wazeko.builder().customAuthStore(store).build();
  const groupJid = "1203630248234@g.us";

  // 1. Update Subject
  await client.groups.updateSubject(groupJid, "Updated Group Title");

  // 2. Update Description
  await client.groups.updateDescription(groupJid, "New Group Rules");

  // 3. Add Participants
  await client.groups.addParticipants(groupJid, ["628111222333@s.whatsapp.net"]);

  // 4. Promote Participants
  await client.groups.promoteParticipants(groupJid, ["628111222333@s.whatsapp.net"]);

  // 5. Demote Participants
  await client.groups.demoteParticipants(groupJid, ["628111222333@s.whatsapp.net"]);

  // 6. Remove Participants
  await client.groups.removeParticipants(groupJid, ["628111222333@s.whatsapp.net"]);

  // 7. Invite Code & Join
  const code = await client.groups.getInviteCode(groupJid);
  assert.ok(code);

  const joined = await client.groups.joinWithCode(code);
  assert.ok(joined);

  // 8. Leave Group
  await client.groups.leave(groupJid);
});
