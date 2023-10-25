import type { GuildMember } from "discord.js";
import { botlogs } from "..";
import { getUserDocumentByDiscordId } from "../database";

export default {
  execute: async (member: GuildMember) => {
    const document = await getUserDocumentByDiscordId(member.id);
    if (!document) return;

    botlogs?.send({
      embeds: [
        {
          title: "driver joined the server",
          fields: [
            {
              name: "Discord user",
              value: `${member} (${member.user.tag})`,
              inline: true,
            },
            {
              name: "Username",
              value: document.username,
              inline: true,
            },
            {
              name: "Steam ID",
              value: document.steam_id,
              inline: true,
            },
          ],
        },
      ],
    });
  },
};
