use tokio::sync::broadcast;
use wazeko_types::events::Event;

pub struct EventReceiver {
    receiver: broadcast::Receiver<Event>,
}

impl EventReceiver {
    pub fn new(receiver: broadcast::Receiver<Event>) -> Self {
        Self { receiver }
    }

    pub async fn recv(&mut self) -> Option<Event> {
        match self.receiver.recv().await {
            Ok(event) => Some(event),
            Err(broadcast::error::RecvError::Lagged(_)) => {
                // If lagged, try receiving the next message
                self.receiver.recv().await.ok()
            }
            Err(broadcast::error::RecvError::Closed) => None,
        }
    }
}
