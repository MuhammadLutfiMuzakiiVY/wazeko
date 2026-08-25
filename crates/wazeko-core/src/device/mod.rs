use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DeviceIdentity {
    pub name: String,
    pub os: String,
    pub client_version: (u32, u32, u32),
    pub device_id: u32,
    pub registration_id: u32,
}

impl Default for DeviceIdentity {
    fn default() -> Self {
        Self {
            name: "Wazeko Client".to_string(),
            os: "Rust/Wazeko".to_string(),
            client_version: (2, 3000, 1015901307),
            device_id: 0,
            registration_id: rand::random::<u16>() as u32,
        }
    }
}
