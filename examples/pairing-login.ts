import { Wazeko } from "../packages/wazeko/src/index.js";
import { PairingCodeEvent, ConnectionState } from "../packages/wazeko-types/src/index.js";

async function main() {
  const client = Wazeko.builder()
    .authStore("./auth_pairing")
    .pairingPhoneNumber("6281234567890")
    .build();

  client.on("pairing.code", (codeEvent: PairingCodeEvent) => {
    console.log(`Enter this code on WhatsApp: ${codeEvent.code}`);
  });

  client.on("connection.update", (state: ConnectionState) => {
    console.log(`Connection state: ${state}`);
  });

  await client.connect();
}

main().catch(console.error);
