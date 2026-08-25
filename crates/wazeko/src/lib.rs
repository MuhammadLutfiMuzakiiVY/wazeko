pub mod builder;
pub mod client;
pub mod config;
pub mod events;
pub mod groups;
pub mod messaging;

pub use builder::WazekoBuilder;
pub use client::Wazeko;
pub use config::ClientConfig;

// Re-export key types and subcrates
pub use wazeko_auth as auth;
pub use wazeko_core as core;
pub use wazeko_transport as transport;
pub use wazeko_types as types;

// Flatten commonly used types into root
pub use wazeko_auth::{AuthMethod, AuthStore, FileAuthStore, MemoryAuthStore};
pub use wazeko_core::error::{Error, Result};
pub use wazeko_types::events::{ConnectionState, Event, QrCodeEvent, PairingCodeEvent};
pub use wazeko_types::jid::{Jid, JidServer};
pub use wazeko_types::message::{Message, MessageContent, MessageId, MessageSource, MessageStatus};
pub use wazeko_types::group::{GroupMetadata, GroupParticipant, ParticipantRole};
