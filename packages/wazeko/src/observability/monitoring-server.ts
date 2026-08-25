import * as http from "http";
import { Wazeko } from "../client.js";
import { MessageQueue } from "../queue/message-queue.js";
import { CommandRegistry } from "../plugins/command-loader.js";

export interface MonitoringServerOptions {
  port?: number;
  host?: string;
  client?: Wazeko;
  queue?: MessageQueue;
  registry?: CommandRegistry;
  qrCodeSupplier?: () => string | null;
}

export class MonitoringServer {
  private server: http.Server | null = null;
  private port: number;
  private host: string;
  private startTime: number = Date.now();
  private client?: Wazeko;
  private queue?: MessageQueue;
  private registry?: CommandRegistry;
  private qrCodeSupplier?: () => string | null;

  constructor(options: MonitoringServerOptions = {}) {
    this.port = options.port ?? 3000;
    this.host = options.host ?? "0.0.0.0";
    this.client = options.client;
    this.queue = options.queue;
    this.registry = options.registry;
    this.qrCodeSupplier = options.qrCodeSupplier;
  }

  setQrSupplier(supplier: () => string | null): void {
    this.qrCodeSupplier = supplier;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, this.host, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) return resolve();
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (pathname === "/health" || pathname === "/status") {
      this.renderHealth(res);
    } else if (pathname === "/metrics") {
      this.renderMetrics(res);
    } else if (pathname === "/qr" || pathname === "/login") {
      this.renderQrPage(res);
    } else if (pathname === "/api/qr") {
      this.renderQrJson(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found", path: pathname }));
    }
  }

  private renderHealth(res: http.ServerResponse): void {
    const mem = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const connState = this.client ? this.client.getConnectionState() : "unknown";
    const queueStats = this.queue ? this.queue.getStats() : undefined;

    const data = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      connection: {
        state: connState,
        authenticatedUser: this.client?.getMe()?.user ?? null,
      },
      memory: {
        rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
      },
      queue: queueStats,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, null, 2));
  }

  private renderMetrics(res: http.ServerResponse): void {
    const queueStats = this.queue?.getStats();
    const commandCount = this.registry?.listCommands().length ?? 0;
    const mem = process.memoryUsage();

    const metrics = {
      wazeko_uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      wazeko_memory_heap_used_bytes: mem.heapUsed,
      wazeko_memory_rss_bytes: mem.rss,
      wazeko_registered_commands: commandCount,
      wazeko_queue_pending: queueStats?.pendingCount ?? 0,
      wazeko_queue_completed: queueStats?.completedCount ?? 0,
      wazeko_queue_failed: queueStats?.failedCount ?? 0,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(metrics, null, 2));
  }

  private renderQrJson(res: http.ServerResponse): void {
    const qr = this.qrCodeSupplier ? this.qrCodeSupplier() : null;
    const connState = this.client ? this.client.getConnectionState() : "unknown";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ qr, state: connState }));
  }

  private renderQrPage(res: http.ServerResponse): void {
    const qr = this.qrCodeSupplier ? this.qrCodeSupplier() : null;
    const connState = this.client ? this.client.getConnectionState() : "unknown";

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wazeko WhatsApp Auth & Monitor</title>
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --accent: #238636;
      --accent-hover: #2ea043;
      --tag-green: #238636;
      --tag-yellow: #d29922;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      text-align: center;
    }
    h1 {
      margin-top: 0;
      font-size: 1.5rem;
      color: #58a6ff;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: #21262d;
      border: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .badge.connected { color: #3fb950; border-color: #238636; }
    .badge.authenticating { color: #d29922; border-color: #9e6a03; }
    .badge.disconnected { color: #f85149; border-color: #da3633; }
    .qr-box {
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      display: inline-block;
      margin: 16px 0;
      min-width: 256px;
      min-height: 256px;
      box-sizing: border-box;
    }
    .qr-text {
      word-break: break-all;
      font-family: monospace;
      font-size: 0.8rem;
      color: #8b949e;
      background: #0d1117;
      padding: 12px;
      border-radius: 6px;
      max-height: 80px;
      overflow-y: auto;
    }
    .instructions {
      font-size: 0.9rem;
      color: #8b949e;
      line-height: 1.5;
      text-align: left;
      margin-top: 20px;
    }
    .instructions ol { padding-left: 20px; margin: 8px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
</head>
<body>
  <div class="container">
    <h1>Wazeko WhatsApp Engine</h1>
    <div id="statusBadge" class="badge ${connState}">Status: ${connState.toUpperCase()}</div>
    
    <div id="qrContainer">
      ${
        connState === "connected"
          ? '<div style="color: #3fb950; padding: 40px 0; font-size: 1.2rem; font-weight: 600;">✓ WhatsApp Terhubung!</div>'
          : '<canvas id="qrCanvas" class="qr-box"></canvas>'
      }
    </div>

    <div class="instructions">
      <strong>Cara Menghubungkan:</strong>
      <ol>
        <li>Buka WhatsApp di Smartphone Anda</li>
        <li>Buka <b>Pengaturan</b> / <b>Titik Tiga</b> > <b>Perangkat Tertaut</b></li>
        <li>Pilih <b>Tautkan Perangkat</b> lalu pindai kode QR di atas</li>
      </ol>
    </div>

    <div style="margin-top: 16px;">
      <a href="/health" style="color: #58a6ff; font-size: 0.85rem; text-decoration: none; margin-right: 12px;">📊 Health API</a>
      <a href="/metrics" style="color: #58a6ff; font-size: 0.85rem; text-decoration: none;">📈 Metrics API</a>
    </div>
  </div>

  <script>
    let currentRaw = "${qr ?? ""}";
    
    function drawQr(raw) {
      const canvas = document.getElementById("qrCanvas");
      if (!canvas || !raw) return;
      QRCode.toCanvas(canvas, raw, { width: 256, margin: 1 }, function (error) {
        if (error) console.error(error);
      });
    }

    if (currentRaw) {
      drawQr(currentRaw);
    }

    // Auto-polling state & QR code every 2 seconds
    setInterval(async () => {
      try {
        const res = await fetch("/api/qr");
        const data = await res.json();
        const badge = document.getElementById("statusBadge");
        if (badge) {
          badge.className = "badge " + data.state;
          badge.innerText = "Status: " + data.state.toUpperCase();
        }

        if (data.state === "connected") {
          document.getElementById("qrContainer").innerHTML = '<div style="color: #3fb950; padding: 40px 0; font-size: 1.2rem; font-weight: 600;">✓ WhatsApp Terhubung!</div>';
        } else if (data.qr && data.qr !== currentRaw) {
          currentRaw = data.qr;
          drawQr(data.qr);
        }
      } catch (e) {}
    }, 2000);
  </script>
</body>
</html>`;

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  }
}
