use std::sync::Arc;
use wazeko_core::error::Result;
use wazeko_types::group::GroupMetadata;
use wazeko_types::jid::Jid;

pub struct Groups {
    _client_internal: Arc<crate::client::ClientState>,
}

impl Groups {
    pub(crate) fn new(client_internal: Arc<crate::client::ClientState>) -> Self {
        Self {
            _client_internal: client_internal,
        }
    }

    pub async fn info(&self, jid: impl Into<Jid>) -> Result<GroupMetadata> {
        let jid = jid.into();
        Ok(GroupMetadata {
            id: jid,
            subject: "Group".to_string(),
            description: None,
            owner: None,
            creation_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            participants: Vec::new(),
            restrict: false,
            announce: false,
        })
    }
}
