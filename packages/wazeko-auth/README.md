# `@wazeko/auth`

Authentication, session persistence, distributed database adapters, and encrypted cloud snapshot backup for **Wazeko**.

---

## 📦 Features

### 1. `AtomicFileAuthStore` (Anti-Corrupt Local Storage)
Prevents JSON file corruption on sudden OS crashes or server reboots by writing to a temporary file (`.tmp`) and performing an OS-level atomic rename with SHA-256 checksum validation:
```ts
import { AtomicFileAuthStore } from "@wazeko/auth";

const store = new AtomicFileAuthStore("./my-session", { checksumValidation: true });
await store.save(credentials);
const creds = await store.load();
```

### 2. `KeyValAuthStore` (Distributed Databases)
Provides a generic adapter to store credentials in **Redis**, **MongoDB**, **PostgreSQL**, or cloud key-value databases:
```ts
import { KeyValAuthStore } from "@wazeko/auth";

const redisStore = new KeyValAuthStore(redisAdapter, "session-instance-01");
```

### 3. `SessionBackupManager` (Encrypted Cloud Backup)
Encrypts credentials snapshots using **AES-256-GCM** (12-byte IV + 16-byte authentication tag) and uploads to S3, Google Cloud Storage, or Webhooks:
```ts
import { SessionBackupManager, LocalArchiveBackupProvider } from "@wazeko/auth";

const backupManager = new SessionBackupManager({
  encryptionKey: "super-secret-cluster-passphrase",
  backupProvider: new LocalArchiveBackupProvider(),
});

// Create encrypted snapshot
const { backupId, location } = await backupManager.createBackup(store, "daily-backup");

// Restore on disaster recovery
await backupManager.restoreBackup(store, "daily-backup");
```

### 4. `QrCodeManager` & `PairingCodeManager`
Handles QR code string formatting and 8-character (4-4 alphanumeric) pairing code generation.
