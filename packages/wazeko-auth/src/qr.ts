import qrcodeTerminal from "qrcode-terminal";
import { QrCodeEvent } from "../../wazeko-types/src/index.js";

export class QrCodeManager {
  private currentQr: QrCodeEvent | null = null;

  updateQr(raw: string, attempts: number, timeoutSeconds: number = 60): QrCodeEvent {
    const event: QrCodeEvent = {
      raw,
      attempts,
      timeoutSeconds,
    };
    this.currentQr = event;
    return event;
  }

  printTerminal(small: boolean = true): void {
    if (this.currentQr) {
      console.log(`\n=== SCAN WHATSAPP QR CODE (Attempt #${this.currentQr.attempts}) ===`);
      qrcodeTerminal.generate(this.currentQr.raw, { small }, (qrcode) => {
        console.log(qrcode);
      });
      console.log("===================================================\n");
    }
  }

  get current(): QrCodeEvent | null {
    return this.currentQr;
  }
}
