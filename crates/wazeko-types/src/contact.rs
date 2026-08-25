use crate::jid::Jid;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Contact {
    pub id: Jid,
    pub name: Option<String>,
    pub notify: Option<String>,
    pub verified_name: Option<String>,
    pub status: Option<String>,
}

impl Contact {
    pub fn new(id: Jid) -> Self {
        Self {
            id,
            name: None,
            notify: None,
            verified_name: None,
            status: None,
        }
    }
}
