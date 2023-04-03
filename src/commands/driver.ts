import { getUserDocumentByDiscordId, getUserDocumentBySteamId, Jobs, UserDocument } from "../database";
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("driver")
        .setDescription("Get info about specific driver or yourself.")
        .addUserOption((o) => o.setName("user").setDescription("Discord user."))
        .addStringOption((o) => o.setName("steamid").setDescription("SteamID."))
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        let user = interaction.options.getUser("user");
        const steamid = interaction.options.getString("steamid");

        let document: UserDocument | null;
        if (steamid) document = await getUserDocumentBySteamId(steamid, true);
        else if (user) document = await getUserDocumentByDiscordId(user.id);
        else document = await getUserDocumentByDiscordId(interaction.user.id);

        if (!document) return interaction.reply({ content: "User not found.", ephemeral: true });

        await interaction.deferReply();

        const mdist = Math.round(document.leaderboard.monthly_mileage);
        const adist = Math.round(document.leaderboard.alltime_mileage);
        const jobs = await Jobs.find({ "driver.steam_id": document.steam_id }).count();

        if (!user) user = await interaction.client.users.fetch(document.discord_id);

        const embed = new EmbedBuilder()
            .setTitle("Driver info")
            .setDescription([
                `**Discord:** ${`${user} (${user.tag})`}`,
                `**SteamID:** ${document.steam_id}`,
                `[**TruckersMP Search**](https://truckersmp.com/user/search?search=${document.steam_id})`,
                `**Username:** ${document.username}`,
                `**Monthly mileage:** ${mdist.toLocaleString()}km`,
                `**Total mileage:** ${adist.toLocaleString()}km`,
                `**Jobs:** ${jobs}`
            ].join("\n"));

        return interaction.editReply({ embeds: [embed] });
    }
};