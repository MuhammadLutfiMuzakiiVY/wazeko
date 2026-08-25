export type NodeAttributes = Record<string, string>;

export type NodeContent =
  | null
  | undefined
  | Uint8Array
  | ProtocolNode[];

export interface ProtocolNode {
  tag: string;
  attrs: NodeAttributes;
  content?: NodeContent;
}

export class ProtocolNodeBuilder {
  private _tag: string;
  private _attrs: NodeAttributes = {};
  private _content?: NodeContent;

  constructor(tag: string) {
    this._tag = tag;
  }

  static create(tag: string): ProtocolNodeBuilder {
    return new ProtocolNodeBuilder(tag);
  }

  attr(key: string, value: string): this {
    this._attrs[key] = value;
    return this;
  }

  attrs(attributes: NodeAttributes): this {
    Object.assign(this._attrs, attributes);
    return this;
  }

  contentBytes(bytes: Uint8Array): this {
    this._content = bytes;
    return this;
  }

  contentNodes(nodes: ProtocolNode[]): this {
    this._content = nodes;
    return this;
  }

  build(): ProtocolNode {
    return {
      tag: this._tag,
      attrs: { ...this._attrs },
      content: this._content,
    };
  }
}

export function getChildNode(node: ProtocolNode, tag: string): ProtocolNode | undefined {
  if (Array.isArray(node.content)) {
    return node.content.find((child) => child.tag === tag);
  }
  return undefined;
}

export function getChildrenNodes(node: ProtocolNode, tag: string): ProtocolNode[] {
  if (Array.isArray(node.content)) {
    return node.content.filter((child) => child.tag === tag);
  }
  return [];
}
