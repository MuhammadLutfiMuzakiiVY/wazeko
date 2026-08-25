use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};
use wazeko_core::error::{Result, SessionError};
use wazeko_core::session::Credentials;

#[async_trait]
pub trait AuthStore: Send + Sync {
    async fn load(&self) -> Result<Option<Credentials>>;
    async fn save(&self, credentials: &Credentials) -> Result<()>;
    async fn clear(&self) -> Result<()>;
}

/// Persistent JSON file based credentials storage
#[derive(Debug, Clone)]
pub struct FileAuthStore {
    dir_path: PathBuf,
}

impl FileAuthStore {
    pub fn new(path: impl AsRef<Path>) -> Self {
        Self {
            dir_path: path.as_ref().to_path_buf(),
        }
    }

    fn creds_file(&self) -> PathBuf {
        self.dir_path.join("credentials.json")
    }
}

#[async_trait]
impl AuthStore for FileAuthStore {
    async fn load(&self) -> Result<Option<Credentials>> {
        let path = self.creds_file();
        if !path.exists() {
            debug!(target: "wazeko::auth::store", "No existing credentials found at {:?}", path);
            return Ok(None);
        }

        let content = tokio::fs::read_to_string(&path)
            .await
            .map_err(|e| SessionError::Storage(format!("Failed to read creds file: {e}")))?;

        let creds: Credentials = serde_json::from_str(&content)
            .map_err(|e| SessionError::Serialization(format!("Corrupted credentials: {e}")))?;

        info!(target: "wazeko::auth::store", "Loaded credentials from {:?}", path);
        Ok(Some(creds))
    }

    async fn save(&self, credentials: &Credentials) -> Result<()> {
        if !self.dir_path.exists() {
            tokio::fs::create_dir_all(&self.dir_path)
                .await
                .map_err(|e| SessionError::Storage(format!("Failed to create auth dir: {e}")))?;
        }

        let path = self.creds_file();
        let serialized = serde_json::to_string_pretty(credentials)
            .map_err(|e| SessionError::Serialization(e.to_string()))?;

        tokio::fs::write(&path, serialized)
            .await
            .map_err(|e| SessionError::Storage(format!("Failed to write credentials: {e}")))?;

        info!(target: "wazeko::auth::store", "Saved credentials to {:?}", path);
        Ok(())
    }

    async fn clear(&self) -> Result<()> {
        let path = self.creds_file();
        if path.exists() {
            tokio::fs::remove_file(&path)
                .await
                .map_err(|e| SessionError::Storage(format!("Failed to delete credentials: {e}")))?;
            info!(target: "wazeko::auth::store", "Cleared credentials from {:?}", path);
        }
        Ok(())
    }
}

/// In-memory credentials storage (useful for testing or ephemeral sessions)
#[derive(Debug, Clone, Default)]
pub struct MemoryAuthStore {
    inner: Arc<RwLock<Option<Credentials>>>,
}

impl MemoryAuthStore {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(None)),
        }
    }
}

#[async_trait]
impl AuthStore for MemoryAuthStore {
    async fn load(&self) -> Result<Option<Credentials>> {
        let guard = self.inner.read().await;
        Ok(guard.clone())
    }

    async fn save(&self, credentials: &Credentials) -> Result<()> {
        let mut guard = self.inner.write().await;
        *guard = Some(credentials.clone());
        Ok(())
    }

    async fn clear(&self) -> Result<()> {
        let mut guard = self.inner.write().await;
        *guard = None;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_memory_auth_store() {
        let store = MemoryAuthStore::new();
        assert!(store.load().await.unwrap().is_none());

        let mut creds = Credentials::default();
        creds.registered = true;
        store.save(&creds).await.unwrap();

        let loaded = store.load().await.unwrap().expect("Should find creds");
        assert!(loaded.registered);

        store.clear().await.unwrap();
        assert!(store.load().await.unwrap().is_none());
    }
}

