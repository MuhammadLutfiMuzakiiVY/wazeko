import test from "node:test";
import assert from "node:assert/strict";
import { Wazeko } from "../packages/wazeko/src/client.js";
import { MemoryAuthStore } from "../packages/wazeko-auth/src/store.js";

test("Wazeko Client: Builder and message dispatch", async () => {
  const store = new MemoryAuthStore();
  const client = Wazeko.builder()
    .customAuthStore(store)
    .printQr(false)
    .build();

  let receivedMessage: any = null;
  client.on("message", (msg) => {
    receivedMessage = msg;
  });

  const sent = await client.sendMessage("628123456789@s.whatsapp.net", {
    text: "Hello TypeScript Wazeko",
  });

  assert.equal(sent.source.chat.user, "628123456789");
  assert.deepEqual(sent.content, { text: "Hello TypeScript Wazeko" });
  assert.ok(receivedMessage);
  assert.equal(receivedMessage.id, sent.id);
});
