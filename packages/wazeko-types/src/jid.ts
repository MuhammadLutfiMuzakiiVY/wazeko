export type JidServer =
  | "s.whatsapp.net"
  | "g.us"
  | "broadcast"
  | "newsletter"
  | "lid"
  | (string & {});

export interface Jid {
  user: string;
  server: JidServer;
  agent?: number;
  device?: number;
}

export function jidUser(phoneNumber: string): Jid {
  return {
    user: phoneNumber.replace(/\D/g, ""),
    server: "s.whatsapp.net",
  };
}

export function jidGroup(groupId: string): Jid {
  return {
    user: groupId,
    server: "g.us",
  };
}

export function jidToString(jid: Jid): string {
  let user = jid.user;
  if (jid.agent !== undefined) {
    user += `_${jid.agent}`;
  }
  if (jid.device !== undefined) {
    user += `:${jid.device}`;
  }
  return `${user}@${jid.server}`;
}

export function parseJid(jidString: string): Jid {
  const trimmed = jidString.trim();
  if (!trimmed) {
    throw new Error("Empty JID string");
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    throw new Error(`Invalid JID format: "${jidString}"`);
  }

  const fullUser = parts[0];
  const server = parts[1] as JidServer;

  let userPart = fullUser;
  let device: number | undefined;
  let agent: number | undefined;

  if (userPart.includes(":")) {
    const [u, dev] = userPart.split(":");
    userPart = u;
    device = parseInt(dev, 10);
    if (isNaN(device)) device = undefined;
  }

  if (userPart.includes("_")) {
    const [u, ag] = userPart.split("_");
    userPart = u;
    agent = parseInt(ag, 10);
    if (isNaN(agent)) agent = undefined;
  }

  return {
    user: userPart,
    server,
    agent,
    device,
  };
}

export function isJidGroup(jid: Jid | string): boolean {
  const parsed = typeof jid === "string" ? parseJid(jid) : jid;
  return parsed.server === "g.us";
}

export function isJidUser(jid: Jid | string): boolean {
  const parsed = typeof jid === "string" ? parseJid(jid) : jid;
  return parsed.server === "s.whatsapp.net";
}
