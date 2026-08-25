import test from "node:test";
import assert from "node:assert/strict";
import { Wazeko } from "../packages/wazeko/src/client.js";
import { MemoryAuthStore } from "../packages/wazeko-auth/src/store.js";
import { AsyncEventQueue } from "../packages/wazeko/src/events.js";
import { Message } from "../packages/wazeko-types/src/message.js";

test("Client: Builder configuration options", () => {
  const store = new MemoryAuthStore();
  const client = Wazeko.builder()
    .customAuthStore(store)
    .authMethod("pairing-code")
    .pairingPhoneNumber("628123456789")
    .autoReconnect(false)
    .printQr(false)
    .connectTimeout(15000)
    .build();

  assert.ok(client);
  assert.equal(client.getConnectionState(), "disconnected");
});

test("Client: Send message, reply, and sendImage dispatch", async () => {
  const store = new MemoryAuthStore();
  const client = Wazeko.builder()
    .customAuthStore(store)
    .printQr(false)
    .build();

  const dispatchedMessages: Message[] = [];
  client.on("message", (msg) => {
    dispatchedMessages.push(msg);
  });

  // 1. Text Message
  const textMsg = await client.sendMessage("628123456789@s.whatsapp.net", {
    text: "Hello Wazeko Deep Test",
  });
  assert.equal(textMsg.source.chat.user, "628123456789");
  assert.deepEqual(textMsg.content, { text: "Hello Wazeko Deep Test" });

  // 2. Reply Message
  const replyMsg = await client.reply(textMsg, "Echo reply from test");
  assert.equal(replyMsg.source.chat.user, "628123456789");
  if ("reply" in replyMsg.content) {
    assert.equal(replyMsg.content.reply.quotedId, textMsg.id);
    assert.equal(replyMsg.content.reply.quotedText, "Hello Wazeko Deep Test");
    assert.equal(replyMsg.content.reply.text, "Echo reply from test");
  } else {
    assert.fail("Reply message content should contain reply object");
  }

  // 3. Image Message
  const imageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  const imageMsg = await client.sendImage("628123456789@s.whatsapp.net", imageBytes, {
    caption: "Sample Image Caption",
  });
  if ("image" in imageMsg.content) {
    assert.equal(imageMsg.content.caption, "Sample Image Caption");
    assert.equal(imageMsg.content.mimetype, "image/jpeg");
  } else {
    assert.fail("Image message content should contain image object");
  }

  assert.equal(dispatchedMessages.length, 3);
});

test("Client: Group API info foundation query", async () => {
  const store = new MemoryAuthStore();
  const client = Wazeko.builder().customAuthStore(store).build();

  const groupMeta = await client.groups.info("1203630248234@g.us");
  assert.equal(groupMeta.id.user, "1203630248234");
  assert.equal(groupMeta.id.server, "g.us");
  assert.equal(groupMeta.subject, "Group");
  assert.ok(groupMeta.creationTime > 0);
});

test("Events: AsyncEventQueue buffering and async iterator", async () => {
  const queue = new AsyncEventQueue();

  queue.push("connection.update", "connecting");
  queue.push("connection.update", "connected");

  const item1 = await queue.next();
  assert.equal(item1?.name, "connection.update");
  assert.equal(item1?.data, "connecting");

  const item2 = await queue.next();
  assert.equal(item2?.name, "connection.update");
  assert.equal(item2?.data, "connected");

  // Close queue
  queue.close();
  const item3 = await queue.next();
  assert.equal(item3, null);
});
