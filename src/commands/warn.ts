import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { botlogs } from "..";
import { getUserDocumentByDiscordId } from "../database";
import { Warn } from "../database";
import { isDocument } from "@typegoose/typegoose";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Manage driver warns.")
    .addSubcommand((c) =>
      c
        .setName("add")
        .setDescription("Add a warn to a driver.")
        .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account.").setRequired(true))
        .addStringOption((o) => o.setName("description").setDescription("Warn description.").setRequired(true))
    )
    .addSubcommand((c) =>
      c
        .setName("remove")
        .setDescription("Remove a warning.")
        .addIntegerOption((o) => o.setName("id").setDescription("Warn ID.").setRequired(true))
    )
    .addSubcommand((c) =>
      c
        .setName("list")
        .setDescription("List all warns for a driver.")
        .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account.").setRequired(true))
    )
    .setDefaultMemberPermissions(8)
    .toJSON(),
  execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
    const command = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user", true);
    const document = await getUserDocumentByDiscordId(user.id);

    if (command === "add") {
      if (!document)
        return interaction.reply({
          content: "This user is not registered in the database.",
          ephemeral: true,
        });

      const authorDocument = await getUserDocumentByDiscordId(interaction.user.id)!;
      const description = interaction.options.getString("description", true);

      const warn = await Warn.create({
        user: document,
        description,
        createdBy: authorDocument,
      });

      await interaction.reply({
        content: `Warn \`${warn._id}\` created for ${user} (\`${user.tag}\`)`,
        ephemeral: true,
      });

      return void (await botlogs?.send({
        embeds: [
          {
            title: `warn ${warn._id} created`,
            author: {
              name: interaction.user.tag,
              icon_url: interaction.user.displayAvatarURL(),
            },
            fields: [
              {
                name: "discord user",
                value: `${user} \`${user.tag}\` (\`${user.id}\`)`,
              },
              {
                name: "description",
                value: description,
              },
            ],
          },
        ],
      }));
    } else if (command === "remove") {
      const id = interaction.options.getInteger("id", true);

      const warn = await Warn.findById(id);

      if (!warn) {
        return interaction.reply({
          content: "This warn does not exist.",
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: [
          `Warn \`${id}\` removed for ${user} (\`${user.tag}\`):`,
          "```json",
          JSON.stringify(warn.toJSON(), null, 4),
          "```",
        ].join("\n"),
        ephemeral: true,
      });

      return void (await botlogs?.send({
        embeds: [
          {
            title: `warn ${id} deleted`,
            author: {
              name: interaction.user.tag,
              icon_url: interaction.user.displayAvatarURL(),
            },
            description: ["```json", JSON.stringify(warn.toJSON(), null, 4), "```"].join("\n"),
          },
        ],
      }));
    } else if (command === "list") {
      if (!document)
        return interaction.reply({
          content: "This user is not registered in the database.",
          ephemeral: true,
        });

      const warns = await Warn.find({ user: document }).sort({ createdAt: -1 }).exec();

      if (!warns.length)
        return interaction.reply({
          content: "This user does not have any warns.",
          ephemeral: true,
        });

      const embed = new EmbedBuilder().setTitle(`Warns for ${user.tag}`);

      for (const warn of warns) {
        const createdById = isDocument(warn.createdBy) ? warn.createdBy.discord_id : null;
        const createdTimestamp = Math.round(warn.createdAt / 1000);
        const description = warn.description;

        embed.addFields({
          name: `Warn ID: ${warn._id}`,
          value: `Created by: <@${createdById}>\nCreated at: <t:${createdTimestamp}:F>\nDescription: ${description}`,
        });
      }

      return void (await interaction.reply({ embeds: [embed], ephemeral: true }));
    }

    return;
  },
};
