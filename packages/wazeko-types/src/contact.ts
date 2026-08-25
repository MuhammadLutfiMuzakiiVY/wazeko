import { Jid } from "./jid.js";

export interface Contact {
  id: Jid;
  name?: string;
  notify?: string;
  verifiedName?: string;
  status?: string;
}
