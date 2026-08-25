pub mod pairing;
pub mod qr;
pub mod store;

pub use pairing::PairingCodeManager;
pub use qr::QrCodeManager;
pub use store::{AuthStore, FileAuthStore, MemoryAuthStore};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuthMethod {
    QrCode,
    PairingCode,
}
