use crate::error::{ProtocolError, Result};
use crate::protocol::node::{NodeContent, ProtocolNode};
use crate::protocol::tokens::get_token_index;

pub const TAG_LIST_EMPTY: u8 = 0x00;
pub const TAG_LIST_8: u8 = 0x01;
pub const TAG_LIST_16: u8 = 0x02;
pub const TAG_BINARY_8: u8 = 0x03;
pub const TAG_BINARY_32: u8 = 0x04;
pub const TAG_STRING: u8 = 0x05;
pub const TAG_TOKEN: u8 = 0x06;

pub struct Encoder {
    buffer: Vec<u8>,
}

impl Default for Encoder {
    fn default() -> Self {
        Self::new()
    }
}

impl Encoder {
    pub fn new() -> Self {
        Self { buffer: Vec::new() }
    }

    pub fn encode(&mut self, node: &ProtocolNode) -> Result<Vec<u8>> {
        self.buffer.clear();
        self.write_node(node)?;
        Ok(self.buffer.clone())
    }

    fn write_node(&mut self, node: &ProtocolNode) -> Result<()> {
        let has_content = !matches!(node.content, NodeContent::Nil);
        let list_size = 1 + (node.attrs.len() * 2) + if has_content { 1 } else { 0 };

        self.write_list_header(list_size)?;
        self.write_string(&node.tag)?;

        for (k, v) in &node.attrs {
            self.write_string(k)?;
            self.write_string(v)?;
        }

        match &node.content {
            NodeContent::Nil => {}
            NodeContent::Binary(bytes) => {
                self.write_binary(bytes)?;
            }
            NodeContent::List(children) => {
                self.write_list_header(children.len())?;
                for child in children {
                    self.write_node(child)?;
                }
            }
        }

        Ok(())
    }

    fn write_list_header(&mut self, size: usize) -> Result<()> {
        if size == 0 {
            self.buffer.push(TAG_LIST_EMPTY);
        } else if size < 256 {
            self.buffer.push(TAG_LIST_8);
            self.buffer.push(size as u8);
        } else if size < 65536 {
            self.buffer.push(TAG_LIST_16);
            self.buffer.extend_from_slice(&(size as u16).to_be_bytes());
        } else {
            return Err(ProtocolError::EncodingError("List size exceeds 65535".into()).into());
        }
        Ok(())
    }

    fn write_string(&mut self, text: &str) -> Result<()> {
        if let Some(idx) = get_token_index(text) {
            self.buffer.push(TAG_TOKEN);
            self.buffer.push(idx);
        } else {
            let bytes = text.as_bytes();
            let len = bytes.len();
            if len > 65535 {
                return Err(ProtocolError::EncodingError("String too long".into()).into());
            }
            self.buffer.push(TAG_STRING);
            self.buffer.extend_from_slice(&(len as u16).to_be_bytes());
            self.buffer.extend_from_slice(bytes);
        }
        Ok(())
    }

    fn write_binary(&mut self, data: &[u8]) -> Result<()> {
        let len = data.len();
        if len < 256 {
            self.buffer.push(TAG_BINARY_8);
            self.buffer.push(len as u8);
        } else {
            self.buffer.push(TAG_BINARY_32);
            self.buffer.extend_from_slice(&(len as u32).to_be_bytes());
        }
        self.buffer.extend_from_slice(data);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protocol::decoder::Decoder;

    #[test]
    fn test_encode_decode_roundtrip() {
        let node = ProtocolNode::with_tag("iq")
            .attr("id", "12345")
            .attr("type", "get")
            .attr("to", "s.whatsapp.net");

        let mut encoder = Encoder::new();
        let bytes = encoder.encode(&node).expect("Encoding should succeed");
        assert!(!bytes.is_empty());

        let decoded = Decoder::decode(&bytes).expect("Decoding should succeed");
        assert_eq!(decoded.tag, "iq");
        assert_eq!(decoded.get_attr("id"), Some("12345"));
        assert_eq!(decoded.get_attr("type"), Some("get"));
        assert_eq!(decoded.get_attr("to"), Some("s.whatsapp.net"));
    }

    #[test]
    fn test_nested_node_roundtrip() {
        let child = ProtocolNode::with_tag("ping");
        let parent = ProtocolNode::with_tag("iq")
            .attr("id", "ping-1")
            .content_nodes(vec![child]);

        let mut encoder = Encoder::new();
        let bytes = encoder.encode(&parent).expect("Encoding should succeed");

        let decoded = Decoder::decode(&bytes).expect("Decoding should succeed");
        assert_eq!(decoded.tag, "iq");
        let child_node = decoded.get_child("ping").expect("Must contain ping child");
        assert_eq!(child_node.tag, "ping");
    }
}

