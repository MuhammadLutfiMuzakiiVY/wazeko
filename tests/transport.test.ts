import test from "node:test";
import assert from "node:assert/strict";
import {
  ReconnectManager,
  BackoffConfig,
} from "../packages/wazeko-transport/src/reconnect.js";
import { WebSocketTransport } from "../packages/wazeko-transport/src/websocket.js";

test("Reconnect: Exponential backoff calculation and cap", () => {
  const config: BackoffConfig = {
    initialIntervalMs: 1000,
    maxIntervalMs: 5000,
    multiplier: 2.0,
    maxRetries: 4,
  };

  const manager = new ReconnectManager(config);

  // Attempt 1: 1000ms
  assert.equal(manager.nextDelayMs(), 1000);
  assert.equal(manager.attempt, 1);

  // Attempt 2: 2000ms
  assert.equal(manager.nextDelayMs(), 2000);
  assert.equal(manager.attempt, 2);

  // Attempt 3: 4000ms
  assert.equal(manager.nextDelayMs(), 4000);
  assert.equal(manager.attempt, 3);

  // Attempt 4: 5000ms (capped by maxIntervalMs)
  assert.equal(manager.nextDelayMs(), 5000);
  assert.equal(manager.attempt, 4);

  // Attempt 5: exceeded maxRetries -> null
  assert.equal(manager.nextDelayMs(), null);

  // Reset
  manager.reset();
  assert.equal(manager.attempt, 0);
  assert.equal(manager.nextDelayMs(), 1000);
});

test("Transport: WebSocketTransport initial disconnected state & guards", async () => {
  const transport = new WebSocketTransport("wss://localhost:9999", 500);
  assert.equal(transport.isConnected(), false);

  // Sending while disconnected throws ConnectionError
  await assert.rejects(
    async () => {
      await transport.send(new Uint8Array([1, 2, 3]));
    },
    /Cannot send data: WebSocket is not connected/
  );

  await transport.close();
  assert.equal(transport.isConnected(), false);
});
