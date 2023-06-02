import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import ms from "ms";
import table from "text-table";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Get bot's latency.")
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        const then = Date.now();

        await interaction.deferReply();

        const server = Date.now() - then;
        const uptime = ms(interaction.client.uptime);
        const api = interaction.guild.shard.ping;

        const a = table([
            ["Server", "::", `${server}ms`],
            ["WS", "::", `${api}ms`],
            ["API uptime", "::", uptime]
        ], { align: ["l", "c", "l"] });

        return interaction.editReply({
            embeds: [{
                title: "Pong! 🏓",
                description: [
                    "```asciidoc",
                    a,
                    "```"
                ].join("\n")
            }]
        });
    }
};