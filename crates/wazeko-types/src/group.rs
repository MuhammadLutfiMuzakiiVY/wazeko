use crate::jid::Jid;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ParticipantRole {
    Member,
    Admin,
    SuperAdmin,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GroupParticipant {
    pub id: Jid,
    pub role: ParticipantRole,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GroupMetadata {
    pub id: Jid,
    pub subject: String,
    pub description: Option<String>,
    pub owner: Option<Jid>,
    pub creation_time: u64,
    pub participants: Vec<GroupParticipant>,
    pub restrict: bool,
    pub announce: bool,
}
