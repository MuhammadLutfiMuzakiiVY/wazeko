use crate::client::Wazeko;
use crate::config::ClientConfig;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use wazeko_auth::{AuthMethod, AuthStore};
use wazeko_core::device::DeviceIdentity;

pub struct WazekoBuilder {
    config: ClientConfig,
    custom_auth_store: Option<Arc<dyn AuthStore>>,
}

impl Default for WazekoBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl WazekoBuilder {
    pub fn new() -> Self {
        Self {
            config: ClientConfig::default(),
            custom_auth_store: None,
        }
    }

    pub fn auth_store(mut self, path: impl AsRef<Path>) -> Self {
        self.config.auth_store_path = Some(PathBuf::from(path.as_ref()));
        self
    }

    pub fn custom_auth_store(mut self, store: Arc<dyn AuthStore>) -> Self {
        self.custom_auth_store = Some(store);
        self
    }

    pub fn auth_method(mut self, method: AuthMethod) -> Self {
        self.config.auth_method = method;
        self
    }

    pub fn pairing_phone_number(mut self, phone: impl Into<String>) -> Self {
        self.config.pairing_phone_number = Some(phone.into());
        self.config.auth_method = AuthMethod::PairingCode;
        self
    }

    pub fn ws_url(mut self, url: impl Into<String>) -> Self {
        self.config.ws_url = url.into();
        self
    }

    pub fn auto_reconnect(mut self, enable: bool) -> Self {
        self.config.auto_reconnect = enable;
        self
    }

    pub fn print_qr(mut self, enable: bool) -> Self {
        self.config.print_qr = enable;
        self
    }

    pub fn connect_timeout(mut self, timeout: Duration) -> Self {
        self.config.connect_timeout = timeout;
        self
    }

    pub fn device_identity(mut self, device: DeviceIdentity) -> Self {
        self.config.device = device;
        self
    }

    pub fn build(self) -> Wazeko {
        Wazeko::new(self.config, self.custom_auth_store)
    }
}
