import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { botlogs } from "..";
import { generateId } from "../constants/functions";
import { getUserDocumentByDiscordId, UserDocument } from "../database";

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
                .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account.").setRequired(true))
                .addStringOption((o) => o.setName("id").setDescription("Warn ID.").setRequired(true))
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

            const description = interaction.options.getString("description", true);
            const id = generateId(6);

            document.warns.set(id, {
                id,
                userId: user.id,
                createdById: interaction.user.id,
                description,
                createdTimestamp: Date.now(),
            });
            document.safeSave();

            await interaction.reply({
                content: `Added warn to ${user} (${user.tag}) with description: ${description}`,
                ephemeral: true,
            });

            await botlogs?.send({
                embeds: [{
                    title: `warn ${id} added`,
                    author: {
                        name: interaction.user.tag,
                        icon_url: interaction.user.displayAvatarURL()
                    },
                    fields: [{
                        name: "discord user",
                        value: `${user} \`${user.tag}\` (\`${user.id}\`)`
                    }, {
                        name: "description",
                        value: description
                    }]
                }]
            });
        } else if (command === "remove") {
            if (!document)
                return interaction.reply({
                    content: "This user is not registered in the database.",
                    ephemeral: true,
                });

            const id = interaction.options.getString("id", true);

            if (!document.warns.has(id))
                return interaction.reply({
                    content: "This user does not have a warn with this ID.",
                    ephemeral: true,
                });

            document.warns.delete(id);
            document.safeSave();

            await interaction.reply({
                content: `Removed warn from ${user} (${user.tag}) with ID: ${id}`,
                ephemeral: true,
            });

            await botlogs?.send({
                embeds: [{
                    title: `warn ${id} removed`,
                    author: {
                        name: interaction.user.tag,
                        icon_url: interaction.user.displayAvatarURL()
                    },
                    fields: [{
                        name: "discord user",
                        value: `${user} \`${user.tag}\` (\`${user.id}\`)`
                    }]
                }]
            });
        } else if (command === "list") {
            if (!document)
                return interaction.reply({
                    content: "This user is not registered in the database.",
                    ephemeral: true,
                });

            const warns = document.warns;

            if (!warns.size)
                return interaction.reply({
                    content: "This user does not have any warns.",
                    ephemeral: true,
                });

            const embed = new EmbedBuilder()
                .setTitle(`Warns for ${user.tag}`)

            for (const [id, warn] of warns) {
                const createdById = warn.createdById;
                const createdTimestamp = warn.createdTimestamp;
                const description = warn.description;

                embed.addFields({
                    name: `Warn ID: ${id}`,
                    value: `Created by: <@${createdById}>\nCreated at: <t:${createdTimestamp}:F>\nDescription: ${description}`
                });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        };
    }
};