import { Jid, isJidGroup, jidToString, jidUser, Message, MessageContent } from "../../wazeko-types/src/index.js";
import { ProtocolNodeBuilder } from "../../wazeko-protocol/src/index.js";
import { WazekoClientInternal } from "./client.js";

export class Messaging {
  constructor(private client: WazekoClientInternal) {}

  async sendMessage(to: Jid | string, content: MessageContent): Promise<Message> {
    const toJid = typeof to === "string" ? jidUser(to) : to;
    const msgId = `3EB0${Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString("hex").toUpperCase()}`;
    const meJid = this.client.getMe() ?? jidUser("0");

    const message: Message = {
      id: msgId,
      source: {
        chat: toJid,
        sender: meJid,
        isFromMe: true,
        isGroup: isJidGroup(toJid),
      },
      content,
      timestamp: Math.floor(Date.now() / 1000),
      status: "pending",
    };

    const node = ProtocolNodeBuilder.create("message")
      .attr("id", msgId)
      .attr("to", jidToString(toJid))
      .attr("type", "text")
      .build();

    await this.client.dispatchNode(node, message);
    return message;
  }

  async sendImage(
    to: Jid | string,
    image: Uint8Array | Buffer | { url: string },
    options?: { caption?: string; mimetype?: string }
  ): Promise<Message> {
    return this.sendMessage(to, {
      image,
      caption: options?.caption,
      mimetype: options?.mimetype ?? "image/jpeg",
    });
  }

  async reply(original: Message, text: string): Promise<Message> {
    let quotedText = "";
    if ("text" in original.content) {
      quotedText = original.content.text;
    } else if ("reply" in original.content) {
      quotedText = original.content.reply.text;
    } else {
      quotedText = "[Media]";
    }

    return this.sendMessage(original.source.chat, {
      reply: {
        quotedId: original.id,
        quotedText,
        text,
      },
    });
  }
}
