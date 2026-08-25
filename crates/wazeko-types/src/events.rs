use crate::group::GroupMetadata;
use crate::jid::Jid;
use crate::message::{Message, MessageId, MessageStatus};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Authenticating,
    Connected,
    Reconnecting,
    LoggedOut,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct QrCodeEvent {
    pub raw: String,
    pub attempts: u32,
    pub timeout_seconds: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PairingCodeEvent {
    pub code: String,
    pub expires_in_seconds: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MessageReceiptEvent {
    pub message_id: MessageId,
    pub chat: Jid,
    pub sender: Option<Jid>,
    pub status: MessageStatus,
    pub timestamp: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Event {
    ConnectionUpdate(ConnectionState),
    Qr(QrCodeEvent),
    PairingCode(PairingCodeEvent),
    Authenticated { user_jid: Jid },
    Message(Message),
    MessageReceipt(MessageReceiptEvent),
    MessageDeleted { message_id: MessageId, chat: Jid },
    GroupUpdate(GroupMetadata),
    PresenceUpdate { jid: Jid, presence: String },
    Error(String),
    Disconnected { reason: String },
}
