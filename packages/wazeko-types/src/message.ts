import { Jid } from "./jid.js";

export type MessageId = string;

export type MessageStatus =
  | "pending"
  | "server_ack"
  | "delivery_ack"
  | "read"
  | "played";

export interface MessageSource {
  chat: Jid;
  sender: Jid;
  isFromMe: boolean;
  isGroup: boolean;
}

export type MessageContent =
  | { text: string }
  | {
      image: Uint8Array | Buffer | { url: string };
      mimetype?: string;
      caption?: string;
    }
  | {
      video: Uint8Array | Buffer | { url: string };
      mimetype?: string;
      caption?: string;
    }
  | {
      audio: Uint8Array | Buffer | { url: string };
      mimetype?: string;
      ptt?: boolean;
    }
  | {
      document: Uint8Array | Buffer | { url: string };
      mimetype?: string;
      fileName?: string;
    }
  | {
      react: {
        targetId: MessageId;
        text: string;
      };
    }
  | {
      reply: {
        quotedId: MessageId;
        quotedText: string;
        text: string;
      };
    };

export interface Message {
  id: MessageId;
  source: MessageSource;
  content: MessageContent;
  timestamp: number;
  status: MessageStatus;
}
