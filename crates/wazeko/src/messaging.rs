use std::sync::Arc;
use wazeko_core::error::Result;
use wazeko_types::jid::Jid;
use wazeko_types::message::{Message, MessageContent, MessageSource, MessageStatus};

pub struct Messaging {
    client_internal: Arc<crate::client::ClientState>,
}

impl Messaging {
    pub(crate) fn new(client_internal: Arc<crate::client::ClientState>) -> Self {
        Self { client_internal }
    }

    pub async fn send(&self, to: impl Into<Jid>, content: MessageContent) -> Result<Message> {
        let to_jid = to.into();
        let msg_id = format!("3EB0{}", hex::encode(rand::random::<[u8; 8]>()).to_uppercase());
        let me_jid = self.client_internal.get_me().unwrap_or_else(|| Jid::user("0"));

        let source = MessageSource {
            chat: to_jid.clone(),
            sender: me_jid,
            is_from_me: true,
            is_group: to_jid.is_group(),
        };

        let message = Message {
            id: msg_id.clone(),
            source,
            content,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            status: MessageStatus::Pending,
        };

        self.client_internal.dispatch_message_send(&message).await?;
        Ok(message)
    }

    pub async fn reply(&self, original: &Message, text: impl Into<String>) -> Result<Message> {
        let original_text = match &original.content {
            MessageContent::Text(t) => t.clone(),
            MessageContent::Reply { text, .. } => text.clone(),
            _ => "[Media]".to_string(),
        };

        let reply_content = MessageContent::Reply {
            quoted_id: original.id.clone(),
            quoted_text: original_text,
            text: text.into(),
        };

        self.send(original.source.chat.clone(), reply_content).await
    }
}
