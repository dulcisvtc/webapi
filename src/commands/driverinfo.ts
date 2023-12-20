import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Jobs, getUserDocumentByDiscordId } from "../database";

export default {
  data: new ContextMenuCommandBuilder() //
    .setName("Driver Info")
    .setType(ApplicationCommandType.User)
    .toJSON(),
  execute: async (interaction: ContextMenuCommandInteraction<"cached">) => {
    const user = await interaction.client.users.fetch(interaction.targetId);
    const document = await getUserDocumentByDiscordId(interaction.targetId);

    if (!document) return interaction.reply({ content: "The selected user is not a driver.", ephemeral: true });

    const ephemeral = !!interaction.channel?.permissionsFor(interaction.member).has(PermissionFlagsBits.SendMessages);
    await interaction.deferReply({ ephemeral });

    const mdist = Math.round(document.leaderboard.monthly_mileage);
    const adist = Math.round(document.leaderboard.alltime_mileage);
    const jobs = await Jobs.find({ "driver.steam_id": document.steam_id }).countDocuments();

    const embed = new EmbedBuilder()
      .setTitle("Driver info")
      .setDescription(
        [
          `**Discord:** ${`${user} (${user.tag})`}`,
          `**SteamID:** ${document.steam_id}`,
          `[**TruckersMP Search**](https://truckersmp.com/user/search?search=${document.steam_id})`,
          `**Username:** ${document.username}`,
          `**Monthly mileage:** ${mdist.toLocaleString()}km`,
          `**Total mileage:** ${adist.toLocaleString()}km`,
          `**Jobs:** ${jobs}`,
        ].join("\n")
      );

    return interaction.editReply({ embeds: [embed] });
  },
};
