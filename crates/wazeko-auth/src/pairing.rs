use rand::Rng;
use tracing::info;
use wazeko_types::events::PairingCodeEvent;

pub struct PairingCodeManager {
    current_code: Option<PairingCodeEvent>,
}

impl Default for PairingCodeManager {
    fn default() -> Self {
        Self::new()
    }
}

impl PairingCodeManager {
    pub fn new() -> Self {
        Self { current_code: None }
    }

    pub fn generate_code(&mut self, expires_in_seconds: u64) -> PairingCodeEvent {
        let mut rng = rand::thread_rng();
        let charset = b"23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // WhatsApp pairing base32-like alphabet
        let p1: String = (0..4)
            .map(|_| {
                let idx = rng.gen_range(0..charset.len());
                charset[idx] as char
            })
            .collect();
        let p2: String = (0..4)
            .map(|_| {
                let idx = rng.gen_range(0..charset.len());
                charset[idx] as char
            })
            .collect();

        let formatted = format!("{p1}-{p2}");
        let event = PairingCodeEvent {
            code: formatted,
            expires_in_seconds,
        };
        self.current_code = Some(event.clone());
        event
    }

    pub fn print_code(&self) {
        if let Some(event) = &self.current_code {
            info!(target: "wazeko::auth::pairing", "Pairing Code: {}", event.code);
            println!("\n==============================");
            println!("  WHATSAPP PAIRING CODE: {}", event.code);
            println!("  Expires in: {}s", event.expires_in_seconds);
            println!("==============================\n");
        }
    }

    pub fn current(&self) -> Option<&PairingCodeEvent> {
        self.current_code.as_ref()
    }
}
