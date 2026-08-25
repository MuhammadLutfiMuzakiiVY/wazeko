import { ProtocolNode } from "./node.js";
import { getTokenIndex } from "./tokens.js";

export const TAG_LIST_EMPTY = 0x00;
export const TAG_LIST_8 = 0x01;
export const TAG_LIST_16 = 0x02;
export const TAG_BINARY_8 = 0x03;
export const TAG_BINARY_32 = 0x04;
export const TAG_STRING = 0x05;
export const TAG_TOKEN = 0x06;

export class BinaryEncoder {
  private buffer: number[] = [];

  encode(node: ProtocolNode): Uint8Array {
    this.buffer = [];
    this.writeNode(node);
    return new Uint8Array(this.buffer);
  }

  private writeNode(node: ProtocolNode): void {
    const hasContent = node.content !== null && node.content !== undefined;
    const attrEntries = Object.entries(node.attrs);
    const listSize = 1 + attrEntries.length * 2 + (hasContent ? 1 : 0);

    this.writeListHeader(listSize);
    this.writeString(node.tag);

    for (const [key, value] of attrEntries) {
      this.writeString(key);
      this.writeString(value);
    }

    if (hasContent) {
      if (node.content instanceof Uint8Array) {
        this.writeBinary(node.content);
      } else if (Array.isArray(node.content)) {
        this.writeListHeader(node.content.length);
        for (const child of node.content) {
          this.writeNode(child);
        }
      }
    }
  }

  private writeListHeader(size: number): void {
    if (size === 0) {
      this.buffer.push(TAG_LIST_EMPTY);
    } else if (size < 256) {
      this.buffer.push(TAG_LIST_8, size);
    } else if (size < 65536) {
      this.buffer.push(TAG_LIST_16, (size >> 8) & 0xff, size & 0xff);
    } else {
      throw new Error(`List size exceeds 65535: ${size}`);
    }
  }

  private writeString(text: string): void {
    const tokenIndex = getTokenIndex(text);
    if (tokenIndex !== undefined && tokenIndex < 256) {
      this.buffer.push(TAG_TOKEN, tokenIndex);
    } else {
      const bytes = new TextEncoder().encode(text);
      const len = bytes.length;
      if (len > 65535) {
        throw new Error("String length exceeds 65535");
      }
      this.buffer.push(TAG_STRING, (len >> 8) & 0xff, len & 0xff);
      for (let i = 0; i < bytes.length; i++) {
        this.buffer.push(bytes[i]);
      }
    }
  }

  private writeBinary(data: Uint8Array): void {
    const len = data.length;
    if (len < 256) {
      this.buffer.push(TAG_BINARY_8, len);
    } else {
      this.buffer.push(
        TAG_BINARY_32,
        (len >> 24) & 0xff,
        (len >> 16) & 0xff,
        (len >> 8) & 0xff,
        len & 0xff
      );
    }
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data[i]);
    }
  }
}
