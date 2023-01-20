import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { User } from "../database";

export default {
    data: new SlashCommandBuilder()
        .setName("lookup")
        .setDescription("Lookup a user in database.")
        .addUserOption((o) => o.setName("user").setDescription("Discord user."))
        .addStringOption((o) => o.setName("steamid").setDescription("SteamID."))
        .setDefaultMemberPermissions(8)
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        const user = interaction.options.getUser("user");
        const steamid = interaction.options.getString("steamid");
        if (!user && !steamid) return interaction.reply({ content: "You must provide a user or a SteamID.", ephemeral: true });
        if (user && steamid) return interaction.reply({ content: "You can only provide a user or a SteamID, not both.", ephemeral: true });

        let document;
        if (user) document = await User.findOne({ discord_id: user.id });
        else document = await User.findOne({ steam_id: steamid });

        if (!document) return interaction.reply({ content: "User not found.", ephemeral: true });

        return interaction.reply({
            content: `\`\`\`json\n${JSON.stringify(document, null, 4)}\n\`\`\``,
            ephemeral: true
        });
    }
};