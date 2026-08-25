export namespace WAProto {
  export interface MessageKey {
    remoteJid?: string;
    fromMe?: boolean;
    id?: string;
    participant?: string;
  }

  export interface ExtendedTextMessage {
    text?: string;
    matchedText?: string;
    canonicalUrl?: string;
    description?: string;
    title?: string;
    jpegThumbnail?: Uint8Array;
    contextInfo?: ContextInfo;
  }

  export interface ImageMessage {
    url?: string;
    mimetype?: string;
    caption?: string;
    fileSha256?: Uint8Array;
    fileLength?: number;
    height?: number;
    width?: number;
    mediaKey?: Uint8Array;
    fileEncSha256?: Uint8Array;
    directPath?: string;
    jpegThumbnail?: Uint8Array;
    contextInfo?: ContextInfo;
  }

  export interface ContextInfo {
    stanzaId?: string;
    participant?: string;
    quotedMessage?: IMessage;
    remoteJid?: string;
    mentionedJid?: string[];
  }

  export interface ReactionMessage {
    key?: MessageKey;
    text?: string;
    groupingKey?: string;
    senderTimestampMs?: number;
  }

  export interface IMessage {
    conversation?: string;
    extendedTextMessage?: ExtendedTextMessage;
    imageMessage?: ImageMessage;
    reactionMessage?: ReactionMessage;
  }

  export interface WebMessageInfo {
    key: MessageKey;
    message?: IMessage;
    messageTimestamp?: number;
    status?: number;
    participant?: string;
  }
}
