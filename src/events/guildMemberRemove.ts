import type { GuildMember, PartialGuildMember } from "discord.js";
import { botlogs } from "..";
import { getUserDocumentByDiscordId } from "../database";

export default {
    execute: async (member: GuildMember | PartialGuildMember) => {
        const document = await getUserDocumentByDiscordId(member.id);
        if (!document) return;

        botlogs?.send({
            embeds: [{
                title: "driver left the server",
                fields: [{
                    name: "Discord user",
                    value: `${member} (${member.user.tag})`,
                    inline: true
                }, {
                    name: "Username",
                    value: document.username,
                    inline: true
                }, {
                    name: "Steam ID",
                    value: document.steam_id,
                    inline: true
                }]
            }]
        });
    }
};