use crate::error::{ProtocolError, Result};
use crate::protocol::encoder::{
    TAG_BINARY_32, TAG_BINARY_8, TAG_LIST_16, TAG_LIST_8, TAG_LIST_EMPTY, TAG_STRING, TAG_TOKEN,
};
use crate::protocol::node::{NodeAttributes, NodeContent, ProtocolNode};
use crate::protocol::tokens::get_token;
use std::collections::HashMap;

pub struct Decoder<'a> {
    data: &'a [u8],
    offset: usize,
}

impl<'a> Decoder<'a> {
    pub fn new(data: &'a [u8]) -> Self {
        Self { data, offset: 0 }
    }

    pub fn decode(data: &'a [u8]) -> Result<ProtocolNode> {
        let mut decoder = Self::new(data);
        decoder.read_node()
    }

    pub fn read_node(&mut self) -> Result<ProtocolNode> {
        let list_size = self.read_list_size()?;
        if list_size == 0 {
            return Err(ProtocolError::CorruptedBuffer("Empty node list".into()).into());
        }

        let tag = self.read_string()?;
        let mut attrs: NodeAttributes = HashMap::new();

        // Each attribute is 2 elements (key, value)
        let num_attrs = (list_size - 1) / 2;
        for _ in 0..num_attrs {
            let key = self.read_string()?;
            let val = self.read_string()?;
            attrs.insert(key, val);
        }

        let has_content = (list_size - 1) % 2 == 1;
        let content = if has_content {
            self.read_content()?
        } else {
            NodeContent::Nil
        };

        Ok(ProtocolNode { tag, attrs, content })
    }

    fn read_content(&mut self) -> Result<NodeContent> {
        if self.offset >= self.data.len() {
            return Ok(NodeContent::Nil);
        }

        let tag = self.peek_byte()?;
        match tag {
            TAG_LIST_EMPTY | TAG_LIST_8 | TAG_LIST_16 => {
                let count = self.read_list_size()?;
                let mut children = Vec::with_capacity(count);
                for _ in 0..count {
                    children.push(self.read_node()?);
                }
                Ok(NodeContent::List(children))
            }
            TAG_BINARY_8 | TAG_BINARY_32 => {
                let bytes = self.read_binary()?;
                Ok(NodeContent::Binary(bytes))
            }
            _ => {
                let text = self.read_string()?;
                Ok(NodeContent::Binary(text.into_bytes()))
            }
        }
    }

    fn peek_byte(&self) -> Result<u8> {
        if self.offset >= self.data.len() {
            Err(ProtocolError::UnexpectedEof.into())
        } else {
            Ok(self.data[self.offset])
        }
    }

    fn read_byte(&mut self) -> Result<u8> {
        if self.offset >= self.data.len() {
            Err(ProtocolError::UnexpectedEof.into())
        } else {
            let b = self.data[self.offset];
            self.offset += 1;
            Ok(b)
        }
    }

    fn read_bytes(&mut self, len: usize) -> Result<&'a [u8]> {
        if self.offset + len > self.data.len() {
            Err(ProtocolError::UnexpectedEof.into())
        } else {
            let slice = &self.data[self.offset..self.offset + len];
            self.offset += len;
            Ok(slice)
        }
    }

    fn read_list_size(&mut self) -> Result<usize> {
        let tag = self.read_byte()?;
        match tag {
            TAG_LIST_EMPTY => Ok(0),
            TAG_LIST_8 => {
                let size = self.read_byte()? as usize;
                Ok(size)
            }
            TAG_LIST_16 => {
                let bytes = self.read_bytes(2)?;
                let size = u16::from_be_bytes([bytes[0], bytes[1]]) as usize;
                Ok(size)
            }
            other => Err(ProtocolError::InvalidHeader(other).into()),
        }
    }

    fn read_string(&mut self) -> Result<String> {
        let tag = self.read_byte()?;
        match tag {
            TAG_TOKEN => {
                let token_idx = self.read_byte()?;
                get_token(token_idx as usize)
                    .map(|s| s.to_string())
                    .ok_or_else(|| ProtocolError::InvalidToken(token_idx).into())
            }
            TAG_STRING => {
                let len_bytes = self.read_bytes(2)?;
                let len = u16::from_be_bytes([len_bytes[0], len_bytes[1]]) as usize;
                let str_bytes = self.read_bytes(len)?;
                String::from_utf8(str_bytes.to_vec())
                    .map_err(|e| ProtocolError::CorruptedBuffer(e.to_string()).into())
            }
            other => Err(ProtocolError::InvalidHeader(other).into()),
        }
    }

    fn read_binary(&mut self) -> Result<Vec<u8>> {
        let tag = self.read_byte()?;
        let len = match tag {
            TAG_BINARY_8 => self.read_byte()? as usize,
            TAG_BINARY_32 => {
                let bytes = self.read_bytes(4)?;
                u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as usize
            }
            other => return Err(ProtocolError::InvalidHeader(other).into()),
        };

        let data = self.read_bytes(len)?;
        Ok(data.to_vec())
    }
}
