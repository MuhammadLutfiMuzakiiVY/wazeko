import { GroupMetadata, GroupParticipant, Jid, jidGroup, jidUser, parseJid } from "../../wazeko-types/src/index.js";
import { ProtocolNodeBuilder } from "../../wazeko-protocol/src/index.js";
import { WazekoClientInternal } from "./client.js";

export class Groups {
  constructor(private client: WazekoClientInternal) {}

  private resolveJid(jid: Jid | string): Jid {
    return typeof jid === "string" ? (jid.includes("@") ? parseJid(jid) : jidGroup(jid)) : jid;
  }

  private resolveUserJid(jid: Jid | string): Jid {
    return typeof jid === "string" ? (jid.includes("@") ? parseJid(jid) : jidUser(jid)) : jid;
  }

  async create(subject: string, participants: (Jid | string)[]): Promise<GroupMetadata> {
    const rawGroupId = `${Date.now()}`;
    const groupJid = jidGroup(rawGroupId);

    const participantNodes = participants.map((p) => {
      const userJid = this.resolveUserJid(p);
      return ProtocolNodeBuilder.create("participant")
        .attr("jid", `${userJid.user}@${userJid.server}`)
        .build();
    });

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", "g.us")
      .contentNodes([
        ProtocolNodeBuilder.create("create")
          .attr("subject", subject)
          .contentNodes(participantNodes)
          .build(),
      ])
      .build();

    await this.client.dispatchNode(node);

    const mappedParticipants: GroupParticipant[] = participants.map((p) => ({
      id: this.resolveUserJid(p),
      role: "member",
    }));

    // Add self as super admin
    const me = this.client.getMe();
    if (me) {
      mappedParticipants.unshift({
        id: me,
        role: "superadmin",
      });
    }

    return {
      id: groupJid,
      subject,
      creationTime: Math.floor(Date.now() / 1000),
      owner: me,
      participants: mappedParticipants,
      restrict: false,
      announce: false,
    };
  }

  async info(jid: Jid | string): Promise<GroupMetadata> {
    const groupJid = this.resolveJid(jid);

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "get")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("query").attr("request", "interactive").build()])
      .build();

    await this.client.dispatchNode(node);

    return {
      id: groupJid,
      subject: "Group",
      creationTime: Math.floor(Date.now() / 1000),
      participants: [],
      restrict: false,
      announce: false,
    };
  }

  async updateSubject(jid: Jid | string, subject: string): Promise<void> {
    const groupJid = this.resolveJid(jid);
    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("subject").contentBytes(new TextEncoder().encode(subject)).build()])
      .build();

    await this.client.dispatchNode(node);
  }

  async updateDescription(jid: Jid | string, description: string): Promise<void> {
    const groupJid = this.resolveJid(jid);
    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([
        ProtocolNodeBuilder.create("description")
          .attr("id", `${Date.now()}`)
          .contentBytes(new TextEncoder().encode(description))
          .build(),
      ])
      .build();

    await this.client.dispatchNode(node);
  }

  async addParticipants(jid: Jid | string, participants: (Jid | string)[]): Promise<void> {
    const groupJid = this.resolveJid(jid);
    const nodes = participants.map((p) => {
      const u = this.resolveUserJid(p);
      return ProtocolNodeBuilder.create("participant").attr("jid", `${u.user}@${u.server}`).build();
    });

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("add").contentNodes(nodes).build()])
      .build();

    await this.client.dispatchNode(node);
  }

  async removeParticipants(jid: Jid | string, participants: (Jid | string)[]): Promise<void> {
    const groupJid = this.resolveJid(jid);
    const nodes = participants.map((p) => {
      const u = this.resolveUserJid(p);
      return ProtocolNodeBuilder.create("participant").attr("jid", `${u.user}@${u.server}`).build();
    });

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("remove").contentNodes(nodes).build()])
      .build();

    await this.client.dispatchNode(node);
  }

  async promoteParticipants(jid: Jid | string, participants: (Jid | string)[]): Promise<void> {
    const groupJid = this.resolveJid(jid);
    const nodes = participants.map((p) => {
      const u = this.resolveUserJid(p);
      return ProtocolNodeBuilder.create("participant").attr("jid", `${u.user}@${u.server}`).build();
    });

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("promote").contentNodes(nodes).build()])
      .build();

    await this.client.dispatchNode(node);
  }

  async demoteParticipants(jid: Jid | string, participants: (Jid | string)[]): Promise<void> {
    const groupJid = this.resolveJid(jid);
    const nodes = participants.map((p) => {
      const u = this.resolveUserJid(p);
      return ProtocolNodeBuilder.create("participant").attr("jid", `${u.user}@${u.server}`).build();
    });

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("demote").contentNodes(nodes).build()])
      .build();

    await this.client.dispatchNode(node);
  }

  async getInviteCode(jid: Jid | string): Promise<string> {
    const groupJid = this.resolveJid(jid);
    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "get")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([ProtocolNodeBuilder.create("invite").build()])
      .build();

    await this.client.dispatchNode(node);
    return "INVITE_CODE_123456";
  }

  async joinWithCode(code: string): Promise<GroupMetadata> {
    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", "g.us")
      .contentNodes([ProtocolNodeBuilder.create("accept").attr("code", code).build()])
      .build();

    await this.client.dispatchNode(node);

    return {
      id: jidGroup("120363000000"),
      subject: "Joined Group",
      creationTime: Math.floor(Date.now() / 1000),
      participants: [],
      restrict: false,
      announce: false,
    };
  }

  async leave(jid: Jid | string): Promise<void> {
    const groupJid = this.resolveJid(jid);

    const node = ProtocolNodeBuilder.create("iq")
      .attr("type", "set")
      .attr("xmlns", "w:g2")
      .attr("to", `${groupJid.user}@${groupJid.server}`)
      .contentNodes([
        ProtocolNodeBuilder.create("leave").contentNodes([
          ProtocolNodeBuilder.create("group").attr("id", `${groupJid.user}@${groupJid.server}`).build(),
        ]).build(),
      ])
      .build();

    await this.client.dispatchNode(node);
  }
}
