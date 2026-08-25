# Contributing to Wazeko 🚀

First off, thank you for considering contributing to **Wazeko**! We welcome all contributions—from fixing typos in the docs to developing new database adapters and protocol enhancements.

---

## 🌟 Ways to Contribute

1. **Bug Reports & Feature Requests**: Open an issue detailing the behavior with logs and reproduction steps.
2. **Documentation & Guides**: Improve code examples, write tutorials, or translate docs.
3. **New Storage Adapters**: Build adapters for PostgreSQL, MongoDB, Redis, Cloudflare KV, or Supabase.
4. **Media & Plugin Extensions**: Create plugins for media converters (ffmpeg), AI integrations (ChatGPT/Gemini/Claude), and webhook gateways.
5. **Performance & Protocols**: Optimize binary codecs, Noise XX handshakes, and Signal Protocol implementations.

---

## 🛠️ Local Development Setup

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/wazeko.git
   cd wazeko
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build TypeScript Packages**:
   ```bash
   npm run build
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

---

## 📋 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Write clean TypeScript code with no unrequested dependencies.
3. Ensure all tests pass (`npm test`).
4. Commit using Conventional Commits:
   - `feat: add MongoDB session adapter`
   - `fix: handle reconnection backoff edge-case`
   - `docs: update quickstart guide`
5. Push to your fork and submit a Pull Request to `main`.

---

## 🏷️ Good First Issues

Looking for somewhere to start? Check issues labeled with [`good first issue`](https://github.com/MuhammadLutfiMuzakiiVY/wazeko/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Thank you for helping make **Wazeko** the most reliable WhatsApp Web engine in the TypeScript ecosystem!
