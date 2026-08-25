use serde::{Deserialize, Serialize};
use wazeko_types::jid::Jid;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct KeyPair {
    pub public_key: Vec<u8>,
    pub private_key: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SignedPreKey {
    pub key_id: u32,
    pub key_pair: KeyPair,
    pub signature: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Credentials {
    pub me: Option<Jid>,
    pub client_id: String,
    pub client_token: Option<String>,
    pub server_token: Option<String>,
    pub enc_key: Option<Vec<u8>>,
    pub mac_key: Option<Vec<u8>>,
    pub noise_key: Option<KeyPair>,
    pub identity_key: Option<KeyPair>,
    pub signed_pre_key: Option<SignedPreKey>,
    pub registration_id: u32,
    pub registered: bool,
}

impl Default for Credentials {
    fn default() -> Self {
        Self {
            me: None,
            client_id: base64::Engine::encode(
                &base64::engine::general_purpose::STANDARD,
                rand::random::<[u8; 16]>(),
            ),
            client_token: None,
            server_token: None,
            enc_key: None,
            mac_key: None,
            noise_key: None,
            identity_key: None,
            signed_pre_key: None,
            registration_id: rand::random::<u16>() as u32,
            registered: false,
        }
    }
}
