use crate::jid::Jid;
use serde::{Deserialize, Serialize};

pub type MessageId = String;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageStatus {
    Pending,
    ServerAck,
    DeliveryAck,
    Read,
    Played,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MessageSource {
    pub chat: Jid,
    pub sender: Jid,
    pub is_from_me: bool,
    pub is_group: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageContent {
    Text(String),
    Image {
        url: Option<String>,
        mimetype: String,
        caption: Option<String>,
        data: Option<Vec<u8>>,
    },
    Video {
        url: Option<String>,
        mimetype: String,
        caption: Option<String>,
        data: Option<Vec<u8>>,
    },
    Audio {
        url: Option<String>,
        mimetype: String,
        ptt: bool, // Push-to-talk (voice note)
        data: Option<Vec<u8>>,
    },
    Document {
        url: Option<String>,
        mimetype: String,
        filename: Option<String>,
        data: Option<Vec<u8>>,
    },
    Reaction {
        target_id: MessageId,
        text: String,
    },
    Reply {
        quoted_id: MessageId,
        quoted_text: String,
        text: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Message {
    pub id: MessageId,
    pub source: MessageSource,
    pub content: MessageContent,
    pub timestamp: u64,
    pub status: MessageStatus,
}

impl Message {
    pub fn new(id: impl Into<MessageId>, source: MessageSource, content: MessageContent, timestamp: u64) -> Self {
        Self {
            id: id.into(),
            source,
            content,
            timestamp,
            status: MessageStatus::Pending,
        }
    }

    pub fn text(text: impl Into<String>) -> MessageContent {
        MessageContent::Text(text.into())
    }

    pub fn reply(quoted_id: impl Into<MessageId>, quoted_text: impl Into<String>, reply_text: impl Into<String>) -> MessageContent {
        MessageContent::Reply {
            quoted_id: quoted_id.into(),
            quoted_text: quoted_text.into(),
            text: reply_text.into(),
        }
    }

    pub fn reaction(target_id: impl Into<MessageId>, emoji: impl Into<String>) -> MessageContent {
        MessageContent::Reaction {
            target_id: target_id.into(),
            text: emoji.into(),
        }
    }
}
