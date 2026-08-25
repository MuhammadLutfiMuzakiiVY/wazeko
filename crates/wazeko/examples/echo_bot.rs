use wazeko::{Event, MessageContent, Wazeko};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let client = Wazeko::builder()
        .auth_store("./auth_bot")
        .print_qr(true)
        .build();

    client.connect().await?;

    let mut events = client.events();
    println!("Wazeko Echo Bot is running...");

    while let Some(event) = events.recv().await {
        if let Event::Message(msg) = event {
            // Ignore messages sent by ourselves
            if msg.source.is_from_me {
                continue;
            }

            if let MessageContent::Text(text) = &msg.content {
                println!("Received message: '{}' from {}", text, msg.source.chat);
                let reply_text = format!("Echo: {text}");
                let _ = client.reply(&msg, reply_text).await;
            }
        }
    }

    Ok(())
}
