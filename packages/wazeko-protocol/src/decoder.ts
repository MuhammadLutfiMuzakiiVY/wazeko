import { NodeAttributes, NodeContent, ProtocolNode } from "./node.js";
import {
  TAG_BINARY_32,
  TAG_BINARY_8,
  TAG_LIST_16,
  TAG_LIST_8,
  TAG_LIST_EMPTY,
  TAG_STRING,
  TAG_TOKEN,
} from "./encoder.js";
import { getToken } from "./tokens.js";

export class BinaryDecoder {
  private data: Uint8Array;
  private offset: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  static decode(data: Uint8Array): ProtocolNode {
    const decoder = new BinaryDecoder(data);
    return decoder.readNode();
  }

  readNode(): ProtocolNode {
    const listSize = this.readListSize();
    if (listSize === 0) {
      throw new Error("Corrupted binary buffer: empty node list");
    }

    const tag = this.readString();
    const attrs: NodeAttributes = {};

    const numAttrs = Math.floor((listSize - 1) / 2);
    for (let i = 0; i < numAttrs; i++) {
      const key = this.readString();
      const val = this.readString();
      attrs[key] = val;
    }

    const hasContent = (listSize - 1) % 2 === 1;
    let content: NodeContent = undefined;

    if (hasContent) {
      content = this.readContent();
    }

    return { tag, attrs, content };
  }

  private readContent(): NodeContent {
    if (this.offset >= this.data.length) {
      return undefined;
    }

    const tag = this.peekByte();
    if (
      tag === TAG_LIST_EMPTY ||
      tag === TAG_LIST_8 ||
      tag === TAG_LIST_16
    ) {
      const count = this.readListSize();
      const children: ProtocolNode[] = [];
      for (let i = 0; i < count; i++) {
        children.push(this.readNode());
      }
      return children;
    }

    if (tag === TAG_BINARY_8 || tag === TAG_BINARY_32) {
      return this.readBinary();
    }

    const text = this.readString();
    return new TextEncoder().encode(text);
  }

  private peekByte(): number {
    if (this.offset >= this.data.length) {
      throw new Error("Unexpected EOF while reading byte");
    }
    return this.data[this.offset];
  }

  private readByte(): number {
    if (this.offset >= this.data.length) {
      throw new Error("Unexpected EOF while reading byte");
    }
    return this.data[this.offset++];
  }

  private readBytes(len: number): Uint8Array {
    if (this.offset + len > this.data.length) {
      throw new Error("Unexpected EOF while reading bytes slice");
    }
    const slice = this.data.subarray(this.offset, this.offset + len);
    this.offset += len;
    return slice;
  }

  private readListSize(): number {
    const tag = this.readByte();
    switch (tag) {
      case TAG_LIST_EMPTY:
        return 0;
      case TAG_LIST_8:
        return this.readByte();
      case TAG_LIST_16: {
        const b = this.readBytes(2);
        return (b[0] << 8) | b[1];
      }
      default:
        throw new Error(`Invalid list tag header: 0x${tag.toString(16)}`);
    }
  }

  private readString(): string {
    const tag = this.readByte();
    switch (tag) {
      case TAG_TOKEN: {
        const tokenIdx = this.readByte();
        const token = getToken(tokenIdx);
        if (token === undefined) {
          throw new Error(`Invalid token index: ${tokenIdx}`);
        }
        return token;
      }
      case TAG_STRING: {
        const b = this.readBytes(2);
        const len = (b[0] << 8) | b[1];
        const strBytes = this.readBytes(len);
        return new TextDecoder().decode(strBytes);
      }
      default:
        throw new Error(`Invalid string tag header: 0x${tag.toString(16)}`);
    }
  }

  private readBinary(): Uint8Array {
    const tag = this.readByte();
    let len = 0;
    if (tag === TAG_BINARY_8) {
      len = this.readByte();
    } else if (tag === TAG_BINARY_32) {
      const b = this.readBytes(4);
      len = (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
    } else {
      throw new Error(`Invalid binary tag header: 0x${tag.toString(16)}`);
    }
    return new Uint8Array(this.readBytes(len));
  }
}
