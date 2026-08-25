import { Jid } from "./jid.js";
import { Message, MessageId, MessageStatus } from "./message.js";
import { GroupMetadata } from "./group.js";

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "connected"
  | "reconnecting"
  | "logged_out";

export interface QrCodeEvent {
  raw: string;
  attempts: number;
  timeoutSeconds: number;
}

export interface PairingCodeEvent {
  code: string;
  expiresInSeconds: number;
}

export interface MessageReceiptEvent {
  messageId: MessageId;
  chat: Jid;
  sender?: Jid;
  status: MessageStatus;
  timestamp: number;
}

export type WazekoEventMap = {
  "connection.update": ConnectionState;
  "qr": QrCodeEvent;
  "pairing.code": PairingCodeEvent;
  "authenticated": { userJid: Jid };
  "message": Message;
  "message.receipt": MessageReceiptEvent;
  "message.delete": { messageId: MessageId; chat: Jid };
  "group.update": GroupMetadata;
  "presence.update": { jid: Jid; presence: string };
  "error": Error;
  "disconnect": { reason: string };
};

export type WazekoEventName = keyof WazekoEventMap;
