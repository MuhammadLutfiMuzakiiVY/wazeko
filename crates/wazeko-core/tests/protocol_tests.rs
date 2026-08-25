use wazeko_core::protocol::{Decoder, Encoder, ProtocolNode};
use wazeko_types::jid::Jid;

#[test]
fn test_complex_protocol_message_tree() {
    let jid = Jid::user("628123456789");
    let node = ProtocolNode::with_tag("message")
        .attr("id", "3EB0TEST1234")
        .attr("to", jid.to_string())
        .attr("type", "text")
        .content_bytes(b"Hello WhatsApp from Wazeko!".to_vec());

    let mut encoder = Encoder::new();
    let bytes = encoder.encode(&node).expect("Must encode without error");

    let decoded = Decoder::decode(&bytes).expect("Must decode without error");
    assert_eq!(decoded.tag, "message");
    assert_eq!(decoded.get_attr("id"), Some("3EB0TEST1234"));
    assert_eq!(decoded.get_attr("to"), Some("628123456789@s.whatsapp.net"));
    assert_eq!(decoded.as_bytes(), Some(b"Hello WhatsApp from Wazeko!".as_slice()));
}
