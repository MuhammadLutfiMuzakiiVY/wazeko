use crate::socket::Socket;
use async_trait::async_trait;
use futures_util::{SinkExt, StreamExt};
use std::time::Duration;
use tokio::net::TcpStream;
use tokio_tungstenite::{
    connect_async,
    tungstenite::Message as WsMessage,
    MaybeTlsStream, WebSocketStream,
};
use tracing::{debug, error, info};
use url::Url;
use wazeko_core::error::{ConnectionError, Error, Result};

pub const DEFAULT_WA_WEB_WS_URL: &str = "wss://web.whatsapp.com/ws/chat";

pub struct WebSocketTransport {
    url: String,
    stream: Option<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    connected: bool,
    timeout: Duration,
}

impl WebSocketTransport {
    pub fn new(url: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            stream: None,
            connected: false,
            timeout: Duration::from_secs(30),
        }
    }

    pub fn default_whatsapp() -> Self {
        Self::new(DEFAULT_WA_WEB_WS_URL)
    }

    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }
}

#[async_trait]
impl Socket for WebSocketTransport {
    async fn connect(&mut self) -> Result<()> {
        let _parsed = Url::parse(&self.url)
            .map_err(|e| ConnectionError::ConnectFailed(format!("Invalid URL: {e}")))?;

        info!(target: "wazeko::transport", "Connecting to WebSocket at {}", self.url);

        let connect_future = connect_async(self.url.as_str());

        let (ws_stream, response) = tokio::time::timeout(self.timeout, connect_future)
            .await
            .map_err(|_| ConnectionError::Timeout)?
            .map_err(|e| ConnectionError::ConnectFailed(e.to_string()))?;

        debug!(target: "wazeko::transport", "Connected with HTTP status: {}", response.status());

        self.stream = Some(ws_stream);
        self.connected = true;
        Ok(())
    }

    async fn send(&mut self, data: Vec<u8>) -> Result<()> {
        let stream = self
            .stream
            .as_mut()
            .ok_or_else(|| ConnectionError::Disconnected("Socket not connected".into()))?;

        stream
            .send(WsMessage::Binary(data))
            .await
            .map_err(|e| ConnectionError::Disconnected(e.to_string()))?;

        Ok(())
    }

    async fn recv(&mut self) -> Result<Option<Vec<u8>>> {
        let stream = self
            .stream
            .as_mut()
            .ok_or_else(|| ConnectionError::Disconnected("Socket not connected".into()))?;

        while let Some(msg_result) = stream.next().await {
            match msg_result {
                Ok(WsMessage::Binary(bytes)) => {
                    return Ok(Some(bytes));
                }
                Ok(WsMessage::Text(text)) => {
                    return Ok(Some(text.into_bytes()));
                }
                Ok(WsMessage::Ping(data)) => {
                    debug!(target: "wazeko::transport", "Received Ping");
                    let _ = stream.send(WsMessage::Pong(data)).await;
                }
                Ok(WsMessage::Pong(_)) => {
                    debug!(target: "wazeko::transport", "Received Pong");
                }
                Ok(WsMessage::Close(frame)) => {
                    info!(target: "wazeko::transport", "Received Close frame: {:?}", frame);
                    self.connected = false;
                    return Ok(None);
                }
                Ok(WsMessage::Frame(_)) => {}
                Err(e) => {
                    error!(target: "wazeko::transport", "WebSocket error: {e}");
                    self.connected = false;
                    return Err(Error::Connection(ConnectionError::Disconnected(e.to_string())));
                }
            }
        }

        self.connected = false;
        Ok(None)
    }

    async fn close(&mut self) -> Result<()> {
        if let Some(mut stream) = self.stream.take() {
            let _ = stream.close(None).await;
        }
        self.connected = false;
        Ok(())
    }

    fn is_connected(&self) -> bool {
        self.connected
    }
}
