use thiserror::Error;
use wazeko_types::jid::JidError;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Error)]
pub enum ProtocolError {
    #[error("Unexpected EOF while parsing binary packet")]
    UnexpectedEof,
    #[error("Invalid token index: {0}")]
    InvalidToken(u8),
    #[error("Invalid node tag or header byte: {0:#x}")]
    InvalidHeader(u8),
    #[error("Corrupted binary buffer: {0}")]
    CorruptedBuffer(String),
    #[error("Encoding error: {0}")]
    EncodingError(String),
}

#[derive(Debug, Error)]
pub enum SessionError {
    #[error("Session not found or not authenticated")]
    NotAuthenticated,
    #[error("Credential storage error: {0}")]
    Storage(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
    #[error("Key exchange error: {0}")]
    KeyExchange(String),
}

#[derive(Debug, Error)]
pub enum ConnectionError {
    #[error("Transport connection failed: {0}")]
    ConnectFailed(String),
    #[error("Connection timed out")]
    Timeout,
    #[error("Disconnected: {0}")]
    Disconnected(String),
    #[error("TLS negotiation error: {0}")]
    Tls(String),
}

#[derive(Debug, Error)]
pub enum Error {
    #[error("Protocol error: {0}")]
    Protocol(#[from] ProtocolError),
    #[error("Session error: {0}")]
    Session(#[from] SessionError),
    #[error("Connection error: {0}")]
    Connection(#[from] ConnectionError),
    #[error("JID error: {0}")]
    Jid(#[from] JidError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("General error: {0}")]
    Other(String),
}
