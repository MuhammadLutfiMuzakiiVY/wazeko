use qrcode::render::unicode;
use qrcode::QrCode;
use tracing::info;
use wazeko_core::error::{Result, SessionError};
use wazeko_types::events::QrCodeEvent;

pub struct QrCodeManager {
    current_qr: Option<QrCodeEvent>,
}

impl Default for QrCodeManager {
    fn default() -> Self {
        Self::new()
    }
}

impl QrCodeManager {
    pub fn new() -> Self {
        Self { current_qr: None }
    }

    pub fn update_qr(&mut self, raw_qr: impl Into<String>, attempt: u32, timeout_seconds: u64) -> QrCodeEvent {
        let event = QrCodeEvent {
            raw: raw_qr.into(),
            attempts: attempt,
            timeout_seconds,
        };
        self.current_qr = Some(event.clone());
        event
    }

    pub fn render_terminal(raw_qr: &str) -> Result<String> {
        let code = QrCode::new(raw_qr.as_bytes())
            .map_err(|e| SessionError::KeyExchange(format!("Failed to generate QR code: {e}")))?;

        let image = code
            .render::<unicode::Dense1x2>()
            .dark_color(unicode::Dense1x2::Light)
            .light_color(unicode::Dense1x2::Dark)
            .build();

        Ok(image)
    }

    pub fn print_terminal(&self) -> Result<()> {
        if let Some(qr) = &self.current_qr {
            let rendered = Self::render_terminal(&qr.raw)?;
            info!(target: "wazeko::auth::qr", "\n{}", rendered);
            println!("\n=== SCAN WHATSAPP QR CODE (Attempt #{}) ===\n{}\n============================================\n", qr.attempts, rendered);
        }
        Ok(())
    }

    pub fn current(&self) -> Option<&QrCodeEvent> {
        self.current_qr.as_ref()
    }
}
