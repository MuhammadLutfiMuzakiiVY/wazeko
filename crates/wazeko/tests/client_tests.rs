use std::sync::Arc;
use wazeko::auth::MemoryAuthStore;
use wazeko::types::events::Event;
use wazeko::types::jid::Jid;
use wazeko::types::message::MessageContent;
use wazeko::Wazeko;

#[tokio::test]
async fn test_client_builder_and_messaging() {
    let memory_store = Arc::new(MemoryAuthStore::new());
    let client = Wazeko::builder()
        .custom_auth_store(memory_store)
        .print_qr(false)
        .build();

    let mut events = client.events();

    let recipient = Jid::user("628123456789");
    let msg = client
        .send_message(recipient.clone(), MessageContent::Text("Hello Integration".into()))
        .await
        .expect("Message send should succeed");

    assert_eq!(msg.source.chat, recipient);
    assert_eq!(
        msg.content,
        MessageContent::Text("Hello Integration".to_string())
    );

    // Verify event dispatched
    let received_event = events.recv().await.expect("Must receive message event");
    match received_event {
        Event::Message(dispatched_msg) => {
            assert_eq!(dispatched_msg.id, msg.id);
        }
        other => panic!("Unexpected event: {:?}", other),
    }
}
