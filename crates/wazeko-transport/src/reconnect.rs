use std::time::Duration;
use tracing::info;

#[derive(Debug, Clone)]
pub struct BackoffConfig {
    pub initial_interval: Duration,
    pub max_interval: Duration,
    pub multiplier: f64,
    pub max_retries: Option<u32>,
}

impl Default for BackoffConfig {
    fn default() -> Self {
        Self {
            initial_interval: Duration::from_secs(1),
            max_interval: Duration::from_secs(30),
            multiplier: 1.5,
            max_retries: None,
        }
    }
}

pub struct ReconnectManager {
    config: BackoffConfig,
    current_attempt: u32,
    current_interval: Duration,
}

impl ReconnectManager {
    pub fn new(config: BackoffConfig) -> Self {
        let initial = config.initial_interval;
        Self {
            config,
            current_attempt: 0,
            current_interval: initial,
        }
    }

    pub fn reset(&mut self) {
        self.current_attempt = 0;
        self.current_interval = self.config.initial_interval;
    }

    pub fn should_retry(&self) -> bool {
        match self.config.max_retries {
            Some(max) => self.current_attempt < max,
            None => true,
        }
    }

    pub fn next_delay(&mut self) -> Option<Duration> {
        if !self.should_retry() {
            return None;
        }

        self.current_attempt += 1;
        let delay = self.current_interval;

        let next_millis = (self.current_interval.as_millis() as f64 * self.config.multiplier) as u64;
        let next_duration = Duration::from_millis(next_millis);
        self.current_interval = next_duration.min(self.config.max_interval);

        info!(
            target: "wazeko::transport::reconnect",
            "Reconnect attempt #{} scheduled after {:?}",
            self.current_attempt, delay
        );

        Some(delay)
    }

    pub fn attempt(&self) -> u32 {
        self.current_attempt
    }
}
