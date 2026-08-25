import { Wazeko } from "../packages/wazeko/src/index.js";
import { QrCodeEvent, ConnectionState, Jid } from "../packages/wazeko-types/src/index.js";

async function main() {
  const client = Wazeko.builder()
    .authStore("./auth_qr")
    .authMethod("qr")
    .printQr(true)
    .build();

  client.on("qr", (qr: QrCodeEvent) => {
    console.log(`New QR received, attempt #${qr.attempts}`);
  });

  client.on("connection.update", (state: ConnectionState) => {
    console.log(`Connection state: ${state}`);
  });

  client.on("authenticated", ({ userJid }: { userJid: Jid }) => {
    console.log("Successfully logged in as:", userJid);
  });

  await client.connect();
}

main().catch(console.error);
