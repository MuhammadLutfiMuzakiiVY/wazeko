import { Jid } from "./jid.js";

export type ParticipantRole = "member" | "admin" | "superadmin";

export interface GroupParticipant {
  id: Jid;
  role: ParticipantRole;
}

export interface GroupMetadata {
  id: Jid;
  subject: string;
  description?: string;
  owner?: Jid;
  creationTime: number;
  participants: GroupParticipant[];
  restrict: boolean;
  announce: boolean;
}
