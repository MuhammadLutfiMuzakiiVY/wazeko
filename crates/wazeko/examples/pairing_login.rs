use wazeko::{Event, Wazeko};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let client = Wazeko::builder()
        .auth_store("./auth_pairing_demo")
        .pairing_phone_number("6281234567890")
        .build();

    client.connect().await?;

    let mut events = client.events();
    while let Some(event) = events.recv().await {
        match event {
            Event::PairingCode(code_event) => {
                println!("Got Pairing Code: {}", code_event.code);
            }
            Event::ConnectionUpdate(state) => {
                println!("Connection state: {state:?}");
            }
            _ => {}
        }
    }

    Ok(())
}
