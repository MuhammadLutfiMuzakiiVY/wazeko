import test from "node:test";
import assert from "node:assert/strict";
import { MemoryAuthStore } from "../packages/wazeko-auth/src/store.js";
import { initCredentials } from "../packages/wazeko-core/src/session.js";

test("Auth Store: MemoryAuthStore lifecycle", async () => {
  const store = new MemoryAuthStore();
  assert.equal(await store.load(), null);

  const creds = initCredentials();
  creds.registered = true;
  await store.save(creds);

  const loaded = await store.load();
  assert.ok(loaded);
  assert.equal(loaded.registered, true);

  await store.clear();
  assert.equal(await store.load(), null);
});
