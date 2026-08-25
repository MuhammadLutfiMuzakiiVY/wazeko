use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type NodeAttributes = HashMap<String, String>;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum NodeContent {
    Nil,
    Binary(Vec<u8>),
    List(Vec<ProtocolNode>),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProtocolNode {
    pub tag: String,
    pub attrs: NodeAttributes,
    pub content: NodeContent,
}

impl ProtocolNode {
    pub fn new(tag: impl Into<String>, attrs: NodeAttributes, content: NodeContent) -> Self {
        Self {
            tag: tag.into(),
            attrs,
            content,
        }
    }

    pub fn with_tag(tag: impl Into<String>) -> Self {
        Self {
            tag: tag.into(),
            attrs: HashMap::new(),
            content: NodeContent::Nil,
        }
    }

    pub fn attr(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.attrs.insert(key.into(), value.into());
        self
    }

    pub fn content_bytes(mut self, data: Vec<u8>) -> Self {
        self.content = NodeContent::Binary(data);
        self
    }

    pub fn content_nodes(mut self, nodes: Vec<ProtocolNode>) -> Self {
        self.content = NodeContent::List(nodes);
        self
    }

    pub fn get_attr(&self, key: &str) -> Option<&str> {
        self.attrs.get(key).map(|s| s.as_str())
    }

    pub fn get_child(&self, tag: &str) -> Option<&ProtocolNode> {
        match &self.content {
            NodeContent::List(children) => children.iter().find(|child| child.tag == tag),
            _ => None,
        }
    }

    pub fn get_children(&self, tag: &str) -> Vec<&ProtocolNode> {
        match &self.content {
            NodeContent::List(children) => children.iter().filter(|child| child.tag == tag).collect(),
            _ => Vec::new(),
        }
    }

    pub fn as_bytes(&self) -> Option<&[u8]> {
        match &self.content {
            NodeContent::Binary(bytes) => Some(bytes),
            _ => None,
        }
    }
}
