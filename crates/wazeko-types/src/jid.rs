use std::fmt;
use std::str::FromStr;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum JidError {
    #[error("Empty JID string")]
    Empty,
    #[error("Invalid JID format: {0}")]
    InvalidFormat(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum JidServer {
    User,       // s.whatsapp.net
    Group,      // g.us
    Broadcast,  // broadcast
    Newsletter, // newsletter
    Lid,        // lid
    Custom(String),
}

impl JidServer {
    pub fn as_str(&self) -> &str {
        match self {
            Self::User => "s.whatsapp.net",
            Self::Group => "g.us",
            Self::Broadcast => "broadcast",
            Self::Newsletter => "newsletter",
            Self::Lid => "lid",
            Self::Custom(s) => s.as_str(),
        }
    }
}

impl fmt::Display for JidServer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl From<&str> for JidServer {
    fn from(s: &str) -> Self {
        match s {
            "s.whatsapp.net" => Self::User,
            "g.us" => Self::Group,
            "broadcast" => Self::Broadcast,
            "newsletter" => Self::Newsletter,
            "lid" => Self::Lid,
            other => Self::Custom(other.to_string()),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Jid {
    pub user: String,
    pub server: JidServer,
    pub agent: Option<u8>,
    pub device: Option<u8>,
}

impl Jid {
    pub fn new(user: impl Into<String>, server: JidServer) -> Self {
        Self {
            user: user.into(),
            server,
            agent: None,
            device: None,
        }
    }

    pub fn user(phone_number: impl Into<String>) -> Self {
        Self::new(phone_number, JidServer::User)
    }

    pub fn group(group_id: impl Into<String>) -> Self {
        Self::new(group_id, JidServer::Group)
    }

    pub fn is_group(&self) -> bool {
        matches!(self.server, JidServer::Group)
    }

    pub fn is_user(&self) -> bool {
        matches!(self.server, JidServer::User)
    }

    pub fn to_non_device(&self) -> Self {
        Self {
            user: self.user.clone(),
            server: self.server.clone(),
            agent: None,
            device: None,
        }
    }
}

impl fmt::Display for Jid {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.user)?;
        if let Some(agent) = self.agent {
            write!(f, "_{agent}")?;
        }
        if let Some(device) = self.device {
            write!(f, ":{device}")?;
        }
        write!(f, "@{}", self.server)
    }
}

impl FromStr for Jid {
    type Err = JidError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = s.trim();
        if s.is_empty() {
            return Err(JidError::Empty);
        }

        let parts: Vec<&str> = s.split('@').collect();
        if parts.len() != 2 {
            return Err(JidError::InvalidFormat(s.to_string()));
        }

        let full_user = parts[0];
        let server_str = parts[1];

        let mut user_part = full_user;
        let mut agent = None;
        let mut device = None;

        if let Some((u, dev)) = user_part.split_once(':') {
            user_part = u;
            device = dev.parse::<u8>().ok();
        }

        if let Some((u, ag)) = user_part.split_once('_') {
            agent = ag.parse::<u8>().ok();
            user_part = u;
        }

        let user = user_part.to_string();

        Ok(Self {
            user,
            server: JidServer::from(server_str),
            agent,
            device,
        })
    }
}

impl From<&str> for Jid {
    fn from(s: &str) -> Self {
        s.parse().unwrap_or_else(|_| Jid::user(s))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jid_parse_user() {
        let jid: Jid = "628123456789@s.whatsapp.net".parse().unwrap();
        assert_eq!(jid.user, "628123456789");
        assert_eq!(jid.server, JidServer::User);
        assert_eq!(jid.device, None);
        assert_eq!(jid.to_string(), "628123456789@s.whatsapp.net");
    }

    #[test]
    fn test_jid_parse_group() {
        let jid: Jid = "1203630248234@g.us".parse().unwrap();
        assert_eq!(jid.user, "1203630248234");
        assert_eq!(jid.server, JidServer::Group);
        assert!(jid.is_group());
    }

    #[test]
    fn test_jid_with_device() {
        let jid: Jid = "628123456789:2@s.whatsapp.net".parse().unwrap();
        assert_eq!(jid.user, "628123456789");
        assert_eq!(jid.device, Some(2));
    }
}

