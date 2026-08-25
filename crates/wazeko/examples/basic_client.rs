use wazeko::Wazeko;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    println!("Starting Wazeko Client...");
    let client = Wazeko::builder()
        .auth_store("./auth")
        .print_qr(true)
        .build();

    client.connect().await?;

    let mut events = client.events();

    while let Some(event) = events.recv().await {
        println!("[Event Received] {event:?}");
    }

    Ok(())
}
