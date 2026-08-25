import { GroupMetadata, Jid, jidGroup } from "../../wazeko-types/src/index.js";
import { WazekoClientInternal } from "./client.js";

export class Groups {
  constructor(private _client: WazekoClientInternal) {}

  async info(jid: Jid | string): Promise<GroupMetadata> {
    const groupJid = typeof jid === "string" ? jidGroup(jid) : jid;
    return {
      id: groupJid,
      subject: "Group",
      creationTime: Math.floor(Date.now() / 1000),
      participants: [],
      restrict: false,
      announce: false,
    };
  }
}
