import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getTMPPlayer } from "../constants/functions";
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

    const ephemeral = !interaction.channel
      ?.permissionsFor(interaction.guild.roles.everyone)
      .has(PermissionFlagsBits.SendMessages);
    await interaction.deferReply({ ephemeral });

    const monthTimestamp = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth());

    const mdist = await Jobs.aggregate<{ mileage: number }>([
      {
        $match: {
          "driver.steam_id": document.steam_id,
          stop_timestamp: { $gte: monthTimestamp },
        },
      },
      { $group: { _id: null, mileage: { $sum: "$driven_distance" } } },
    ]).then((d) => d[0]?.mileage || 0);
    const adist = Math.round(document.leaderboard.alltime_mileage);
    const jobs = await Jobs.find({ "driver.steam_id": document.steam_id }).countDocuments();
    const player = await getTMPPlayer(document.steam_id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle("Driver info")
      .setDescription(
        [
          `**Discord:** ${`${user} (${user.tag})`}`,
          `**SteamID:** ${document.steam_id}`,
          `**TMPID:** ${player?.id} ([**TruckersMP Profile**](https://truckersmp.com/user/${player?.id}))`,
          `**Username:** ${document.username}`,
          `**Monthly mileage:** ${mdist.toLocaleString()}km`,
          `**Total mileage:** ${adist.toLocaleString()}km`,
          `**Jobs:** ${jobs}`,
        ].join("\n")
      );

    return interaction.editReply({ embeds: [embed] });
  },
};
