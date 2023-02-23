import { getUserDocumentByDiscordId } from "../database";
import { GuildMember } from "discord.js";
import { botlogs } from "..";

export default {
    execute: async (member: GuildMember) => {
        const document = await getUserDocumentByDiscordId(member.id);
        if (!document) return;

        botlogs?.send({
            embeds: [{
                title: "user left the server",
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