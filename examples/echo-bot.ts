import { Wazeko } from "../packages/wazeko/src/index.js";
import { Message } from "../packages/wazeko-types/src/index.js";

async function main() {
  const client = Wazeko.builder()
    .authStore("./auth_bot")
    .printQr(true)
    .build();

  client.on("message", async (msg: Message) => {
    if (msg.source.isFromMe) return;

    if ("text" in msg.content) {
      console.log(`Received message: "${msg.content.text}" from`, msg.source.chat);
      await client.reply(msg, `Echo: ${msg.content.text}`);
    }
  });

  await client.connect();
  console.log("Wazeko Echo Bot is running...");
}

main().catch(console.error);
