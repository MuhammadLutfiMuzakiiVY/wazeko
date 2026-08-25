# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of Wazeko and WhatsApp Web protocol integrations seriously.

If you discover a security vulnerability or cryptographic flaw (e.g., in Signal Protocol sessions, Noise handshake, PreKey storage, or credential handling), please do **NOT** open a public issue.

### Disclosure Process
1. Email your findings privately to the repository maintainer.
2. Provide detailed steps to reproduce the vulnerability, including payload examples and expected vs actual behavior.
3. We will acknowledge receipt of your vulnerability report within 48 hours and provide an estimated timeline for a patch.

## Security Practices in Wazeko
- **Cryptographic Isolation**: Keys and session secrets are kept within `@wazeko/core` without leaking into log streams.
- **Strict Parsing**: Binary framing and token decoders are fuzz-tested against buffer overrun and corrupted tags.
- **Zero Raw Eval**: No dynamic eval or insecure JSON deserialization of untrusted payloads.
