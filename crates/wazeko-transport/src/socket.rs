use async_trait::async_trait;
use wazeko_core::error::Result;

#[async_trait]
pub trait Socket: Send + Sync {
    async fn connect(&mut self) -> Result<()>;
    async fn send(&mut self, data: Vec<u8>) -> Result<()>;
    async fn recv(&mut self) -> Result<Option<Vec<u8>>>;
    async fn close(&mut self) -> Result<()>;
    fn is_connected(&self) -> bool;
}
