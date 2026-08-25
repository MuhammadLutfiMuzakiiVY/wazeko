import { Wazeko } from "../packages/wazeko/src/index.js";

async function main() {
  console.log("Starting Wazeko Client (TypeScript)...");

  const client = Wazeko.builder()
    .authStore("./auth")
    .printQr(true)
    .build();

  await client.connect();

  for await (const event of client.events()) {
    console.log(`[Event Received] ${event.name}:`, event.data);
  }
}

main().catch(console.error);
