use wazeko::{AuthMethod, Event, Wazeko};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let client = Wazeko::builder()
        .auth_store("./auth_qr_demo")
        .auth_method(AuthMethod::QrCode)
        .print_qr(true)
        .build();

    client.connect().await?;

    let mut events = client.events();
    while let Some(event) = events.recv().await {
        match event {
            Event::Qr(qr_event) => {
                println!("New QR challenge received! Attempt #{}", qr_event.attempts);
            }
            Event::ConnectionUpdate(state) => {
                println!("Connection state changed: {state:?}");
            }
            Event::Authenticated { user_jid } => {
                println!("Successfully authenticated as: {user_jid}");
                break;
            }
            _ => {}
        }
    }

    Ok(())
}
