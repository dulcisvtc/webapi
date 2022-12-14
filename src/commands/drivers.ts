import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import { getWebhook } from "../constants/functions";
import { getUserDocumentByDiscordId, getUserDocumentBySteamId, resetUserDocument } from "../database";
import Navio from "../lib/navio";
import config from "../config";
import { botlogs } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("drivers")
        .setDescription("Manage drivers.")
        .addSubcommand((c) =>
            c
                .setName("add")
                .setDescription("Add a driver.")
                .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account.").setRequired(true))
                .addStringOption((o) => o.setName("steamid").setDescription("Driver's SteamID.").setRequired(true))
                .addStringOption((o) => o.setName("position").setDescription("User's current position.").setRequired(true))
        )
        .addSubcommand((c) =>
            c
                .setName("remove")
                .setDescription("Remove a driver.")
                .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account. TO AVOID ISSUES PLEASE PROVIDE THIS"))
                .addStringOption((o) => o.setName("steamid").setDescription("Driver's SteamID."))
                .addStringOption((o) => o.setName("reason").setDescription("Reason for removal."))
        )
        .setDefaultMemberPermissions(8)
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        const command = interaction.options.getSubcommand();
        const navio = new Navio(config.navio_api_key);

        if (command === "add") {
            await interaction.reply({
                embeds: [{
                    title: "Processing...",
                    description: "\u200b"
                }],
                ephemeral: true
            });

            const member = interaction.options.getMember("user");
            const steamId = interaction.options.getString("steamid", true);

            if (!member) return interaction.editReply({
                embeds: [{
                    title: "Error!",
                    description: "The user is not in this guild."
                }]
            });

            const result = await navio.addDriver(steamId);

            if (typeof result === "string") {
                await botlogs?.send({
                    embeds: [{
                        title: "error when adding a driver",
                        author: {
                            name: interaction.user.tag,
                            icon_url: interaction.user.displayAvatarURL()
                        },
                        description: result,
                        fields: [{
                            name: "discord user",
                            value: `${member} \`${member.user.tag}\` (\`${member.id}\`)`
                        }, {
                            name: "steamid",
                            value: `\`${steamId}\``
                        }]
                    }]
                });

                return interaction.editReply({
                    embeds: [{
                        title: "Error!",
                        description: result
                    }]
                });
            } else {
                const { append } = await appendGenerator(interaction);
                await append("Driver added to Navio. Creating database document...");

                const document = await getUserDocumentBySteamId(steamId);
                document.discord_id = member.id;
                document.safeSave();
                await append("Database entry created. Trying to give driver role...");

                const role = await member.roles.add(config.driver_role, `Driver added by ${interaction.user.tag}`).catch(() => false as const);
                let roletext = "Role given.";
                if (!role) roletext = "Failed to give role.";
                await append(roletext + " Trying to send member updates webhook...");

                let webhooktext = "Member updates webhook sent.";
                try {
                    const webhook = await getWebhook(
                        interaction.guild.channels.cache.get(config.member_updates_channel) as TextChannel,
                        "Member Updates"
                    );

                    await webhook.send({
                        embeds: [{
                            title: "Member Update",
                            description: `**[${interaction.options.getString("position")}]** ${member} has joined Dulcis Logistics as driver.`
                        }]
                    })
                } catch {
                    webhooktext = "Failed to send member updates webhook."
                };
                await append(webhooktext);

                await append("✨ Done.", "Success!");

                await botlogs?.send({
                    embeds: [{
                        title: "driver added",
                        author: {
                            name: interaction.user.tag,
                            icon_url: interaction.user.displayAvatarURL()
                        },
                        fields: [{
                            name: "discord user",
                            value: `${member} \`${member.user.tag}\` (\`${member.id}\`)`
                        }, {
                            name: "steamid",
                            value: `\`${steamId}\``
                        }]
                    }]
                });
            };
        } else if (command === "remove") {
            let user = interaction.options.getUser("user");
            let steamId = interaction.options.getString("steamid");

            if (!steamId && !user) return interaction.reply({
                content: "You need to provide either a Discord user or a SteamID",
                ephemeral: true
            });

            await interaction.reply({
                embeds: [{
                    title: "Processing...",
                    description: "\u200b"
                }],
                ephemeral: true
            });

            if (!steamId) steamId = (await getUserDocumentByDiscordId(user!.id))?.steam_id ?? null;
            if (!steamId) return interaction.editReply({
                embeds: [{
                    title: "Error!",
                    description: "Can't find SteamID of that user."
                }]
            });
            if (!user) {
                const document = await getUserDocumentBySteamId(steamId);

                if (document.discord_id) user = await interaction.client.users.fetch(document.discord_id).catch(() => null);
            };

            const result = await navio.removeDriver(steamId);

            if (typeof result === "string") {
                await botlogs?.send({
                    embeds: [{
                        title: "error when removing a driver",
                        author: {
                            name: interaction.user.tag,
                            icon_url: interaction.user.displayAvatarURL()
                        },
                        description: result,
                        fields: [{
                            name: "discord user",
                            value: `${user} \`${user?.tag}\` (\`${user?.id}\`)`
                        }, {
                            name: "steamid",
                            value: `\`${steamId}\``
                        }]
                    }]
                });

                return interaction.editReply({
                    embeds: [{
                        title: "Error!",
                        description: result
                    }]
                });
            } else {
                let member = interaction.options.getMember("user");
                if (!member) {
                    const document = await getUserDocumentBySteamId(steamId);

                    if (document.discord_id) member = await interaction.guild.members.fetch(document.discord_id).catch(() => null);
                };
                const reason = interaction.options.getString("reason");
                const { append } = await appendGenerator(interaction);
                await append("Driver removed from Navio. Deleting database document...");

                await resetUserDocument(steamId);
                await append("Database document deleted. Trying to remove driver role...");

                const role = await member?.roles.remove(
                    config.driver_role,
                    `Driver removed by ${interaction.user.tag}`
                ).catch(() => false as const);
                let roletext = "Role removed.";
                if (!role) roletext = "Failed to remove role.";
                await append(roletext + " Trying to send member updates webhook...");

                let webhooktext = "Member updates webhook sent.";
                try {
                    const webhook = await getWebhook(
                        interaction.guild.channels.cache.get(config.member_updates_channel) as TextChannel,
                        "Member Updates"
                    );

                    await webhook.send({
                        embeds: [{
                            title: "Member Update",
                            description: `**[Driver]** ${user} has been removed from driver position.`
                                + (reason ? `\n**Reason:** ${reason}` : "")
                        }]
                    })
                } catch {
                    webhooktext = "Failed to send member updates webhook."
                };
                await append(webhooktext);

                await append("✨ Done.", "Success!");

                await botlogs?.send({
                    embeds: [{
                        title: "driver removed",
                        author: {
                            name: interaction.user.tag,
                            icon_url: interaction.user.displayAvatarURL()
                        },
                        fields: [{
                            name: "discord user",
                            value: `${user} \`${user?.tag}\` (\`${user?.id}\`)`
                        }, {
                            name: "steamid",
                            value: `\`${steamId}\``
                        }, {
                            name: "reason",
                            value: reason ?? "none"
                        }]
                    }]
                });
            };
        };
    }
};

async function appendGenerator(interaction: ChatInputCommandInteraction<"cached">) {
    return {
        append: async (line: string, title?: string) => {
            const msg = await interaction.fetchReply();

            const embed = msg.embeds[0];
            const old = embed.description?.replace("\u200b", "") ?? "";

            return interaction.editReply({
                embeds: [{
                    title: title ?? embed.title ?? undefined,
                    description: old + "\n" + line
                }]
            });
        }
    };
};