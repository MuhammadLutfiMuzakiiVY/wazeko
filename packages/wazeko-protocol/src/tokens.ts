export const SINGLE_BYTE_TOKENS: readonly string[] = [
  "",
  "xmlstreamstart",
  "xmlstreamend",
  "s.whatsapp.net",
  "type",
  "participant",
  "from",
  "receipt",
  "to",
  "ribbon",
  "status_elapsed",
  "napi_version",
  "notify",
  "messages",
  "chat",
  "subject",
  "action",
  "presence",
  "response",
  "resume",
  "status",
  "set",
  "value",
  "get",
  "item",
  "preview",
  "w",
  "media",
  "read",
  "message",
  "pkmsg",
  "msg",
  "raw",
  "query",
  "body",
  "result",
  "media_type",
  "enc",
  "enc_v2",
  "notification",
  "ack",
  "call",
  "relay",
  "ib",
  "edge",
  "login",
  "iq",
  "ping",
  "pin",
  "pong",
  "config",
  "user",
  "group",
  "account",
  "auth",
  "success",
  "failure",
];

const tokenToIndexMap = new Map<string, number>();
SINGLE_BYTE_TOKENS.forEach((token, index) => {
  if (token) {
    tokenToIndexMap.set(token, index);
  }
});

export function getToken(index: number): string | undefined {
  return SINGLE_BYTE_TOKENS[index];
}

export function getTokenIndex(token: string): number | undefined {
  return tokenToIndexMap.get(token);
}
