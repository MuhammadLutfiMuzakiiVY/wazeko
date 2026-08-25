use std::path::PathBuf;
use std::time::Duration;
use wazeko_auth::AuthMethod;
use wazeko_core::device::DeviceIdentity;

#[derive(Debug, Clone)]
pub struct ClientConfig {
    pub ws_url: String,
    pub auth_store_path: Option<PathBuf>,
    pub auth_method: AuthMethod,
    pub pairing_phone_number: Option<String>,
    pub connect_timeout: Duration,
    pub auto_reconnect: bool,
    pub print_qr: bool,
    pub device: DeviceIdentity,
}

impl Default for ClientConfig {
    fn default() -> Self {
        Self {
            ws_url: "wss://web.whatsapp.com/ws/chat".to_string(),
            auth_store_path: None,
            auth_method: AuthMethod::QrCode,
            pairing_phone_number: None,
            connect_timeout: Duration::from_secs(20),
            auto_reconnect: true,
            print_qr: true,
            device: DeviceIdentity::default(),
        }
    }
}
