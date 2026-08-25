use crate::builder::WazekoBuilder;
use crate::config::ClientConfig;
use crate::events::EventReceiver;
use crate::groups::Groups;
use crate::messaging::Messaging;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tracing::{debug, error, info};
use wazeko_auth::{AuthMethod, AuthStore, FileAuthStore, MemoryAuthStore, PairingCodeManager, QrCodeManager};
use wazeko_core::error::Result;
use wazeko_core::protocol::node::ProtocolNode;
use wazeko_core::protocol::Encoder;
use wazeko_core::session::Credentials;
use wazeko_transport::reconnect::{BackoffConfig, ReconnectManager};
use wazeko_types::events::{ConnectionState, Event};
use wazeko_types::jid::Jid;
use wazeko_types::message::{Message, MessageContent};

pub(crate) struct ClientState {
    pub config: ClientConfig,
    pub auth_store: Arc<dyn AuthStore>,
    pub event_tx: broadcast::Sender<Event>,
    pub credentials: RwLock<Credentials>,
    pub connection_state: RwLock<ConnectionState>,
}

impl ClientState {
    pub fn get_me(&self) -> Option<Jid> {
        let creds = self.credentials.try_read().ok()?;
        creds.me.clone()
    }

    pub async fn dispatch_message_send(&self, message: &Message) -> Result<()> {
        let node = ProtocolNode::with_tag("message")
            .attr("id", &message.id)
            .attr("to", message.source.chat.to_string())
            .attr("type", "text");

        let mut encoder = Encoder::new();
        let _encoded = encoder.encode(&node)?;

        debug!(target: "wazeko::client", "Dispatching outgoing message: id={}", message.id);
        let _ = self.event_tx.send(Event::Message(message.clone()));
        Ok(())
    }
}

pub struct Wazeko {
    state: Arc<ClientState>,
}

impl Wazeko {
    pub fn builder() -> WazekoBuilder {
        WazekoBuilder::new()
    }

    pub(crate) fn new(config: ClientConfig, auth_store: Option<Arc<dyn AuthStore>>) -> Self {
        let store: Arc<dyn AuthStore> = if let Some(custom_store) = auth_store {
            custom_store
        } else if let Some(path) = &config.auth_store_path {
            Arc::new(FileAuthStore::new(path))
        } else {
            Arc::new(MemoryAuthStore::new())
        };

        let (event_tx, _) = broadcast::channel(256);

        let state = Arc::new(ClientState {
            config,
            auth_store: store,
            event_tx,
            credentials: RwLock::new(Credentials::default()),
            connection_state: RwLock::new(ConnectionState::Disconnected),
        });

        Self { state }
    }

    pub fn events(&self) -> EventReceiver {
        EventReceiver::new(self.state.event_tx.subscribe())
    }

    pub fn messaging(&self) -> Messaging {
        Messaging::new(self.state.clone())
    }

    pub fn groups(&self) -> Groups {
        Groups::new(self.state.clone())
    }

    pub async fn send_message(&self, to: impl Into<Jid>, content: MessageContent) -> Result<Message> {
        self.messaging().send(to, content).await
    }

    pub async fn send_image(
        &self,
        to: impl Into<Jid>,
        image_bytes: Vec<u8>,
        caption: Option<String>,
    ) -> Result<Message> {
        let content = MessageContent::Image {
            url: None,
            mimetype: "image/jpeg".to_string(),
            caption,
            data: Some(image_bytes),
        };
        self.messaging().send(to, content).await
    }

    pub async fn reply(&self, original: &Message, text: impl Into<String>) -> Result<Message> {
        self.messaging().reply(original, text).await
    }

    pub async fn connect(&self) -> Result<()> {
        let state = self.state.clone();

        self.set_state(ConnectionState::Connecting).await;

        let loaded_creds = state.auth_store.load().await?;
        if let Some(creds) = loaded_creds {
            let mut current = state.credentials.write().await;
            *current = creds;
            info!(target: "wazeko::client", "Restored existing session");
        }

        tokio::spawn(async move {
            if let Err(e) = Self::run_connection_loop(state).await {
                error!(target: "wazeko::client", "Connection loop error: {e}");
            }
        });

        Ok(())
    }

    pub async fn disconnect(&self) -> Result<()> {
        self.set_state(ConnectionState::Disconnected).await;
        let _ = self.state.event_tx.send(Event::Disconnected {
            reason: "Client disconnected by user".to_string(),
        });
        Ok(())
    }

    async fn set_state(&self, new_state: ConnectionState) {
        let mut guard = self.state.connection_state.write().await;
        *guard = new_state;
        let _ = self.state.event_tx.send(Event::ConnectionUpdate(new_state));
    }

    async fn run_connection_loop(state: Arc<ClientState>) -> Result<()> {
        let mut reconnect = ReconnectManager::new(BackoffConfig::default());
        let mut qr_mgr = QrCodeManager::new();
        let mut pairing_mgr = PairingCodeManager::new();

        loop {
            info!(target: "wazeko::client", "Starting connection cycle...");
            let is_registered = {
                let creds = state.credentials.read().await;
                creds.registered
            };

            if is_registered {
                info!(target: "wazeko::client", "Authenticating with saved session credentials...");
                let mut guard = state.connection_state.write().await;
                *guard = ConnectionState::Connected;
                let _ = state.event_tx.send(Event::ConnectionUpdate(ConnectionState::Connected));
            } else {
                let mut guard = state.connection_state.write().await;
                *guard = ConnectionState::Authenticating;
                let _ = state.event_tx.send(Event::ConnectionUpdate(ConnectionState::Authenticating));

                match state.config.auth_method {
                    AuthMethod::QrCode => {
                        let sample_challenge = format!(
                            "2@{},{},{}",
                            base64::Engine::encode(&base64::engine::general_purpose::STANDARD, rand::random::<[u8; 16]>()),
                            base64::Engine::encode(&base64::engine::general_purpose::STANDARD, rand::random::<[u8; 32]>()),
                            base64::Engine::encode(&base64::engine::general_purpose::STANDARD, rand::random::<[u8; 16]>())
                        );
                        let qr_event = qr_mgr.update_qr(sample_challenge, reconnect.attempt() + 1, 60);
                        let _ = state.event_tx.send(Event::Qr(qr_event));

                        if state.config.print_qr {
                            let _ = qr_mgr.print_terminal();
                        }
                    }
                    AuthMethod::PairingCode => {
                        let pairing_event = pairing_mgr.generate_code(120);
                        let _ = state.event_tx.send(Event::PairingCode(pairing_event));
                        pairing_mgr.print_code();
                    }
                }
            }

            if !state.config.auto_reconnect {
                break;
            }

            // Simulates transport health listener
            tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;

            if let Some(delay) = reconnect.next_delay() {
                let mut guard = state.connection_state.write().await;
                *guard = ConnectionState::Reconnecting;
                let _ = state.event_tx.send(Event::ConnectionUpdate(ConnectionState::Reconnecting));
                tokio::time::sleep(delay).await;
            } else {
                break;
            }
        }

        Ok(())
    }
}
