import { PairingCodeEvent } from "../../wazeko-types/src/index.js";

export class PairingCodeManager {
  private currentCode: PairingCodeEvent | null = null;

  generateCode(expiresInSeconds: number = 120): PairingCodeEvent {
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let p1 = "";
    let p2 = "";

    for (let i = 0; i < 4; i++) {
      p1 += charset[Math.floor(Math.random() * charset.length)];
      p2 += charset[Math.floor(Math.random() * charset.length)];
    }

    const code = `${p1}-${p2}`;
    const event: PairingCodeEvent = {
      code,
      expiresInSeconds,
    };
    this.currentCode = event;
    return event;
  }

  printCode(): void {
    if (this.currentCode) {
      console.log("\n==============================");
      console.log(`  WHATSAPP PAIRING CODE: ${this.currentCode.code}`);
      console.log(`  Expires in: ${this.currentCode.expiresInSeconds}s`);
      console.log("==============================\n");
    }
  }

  get current(): PairingCodeEvent | null {
    return this.currentCode;
  }
}
