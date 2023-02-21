import { getUserDocumentByDiscordId, getUserDocumentBySteamId, Jobs, resetUserDocument } from "../database";
import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import { getWebhook } from "../constants/functions";
import { botlogs } from "..";
import Navio from "../lib/navio";
import config from "../config";

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
                .addBooleanOption((o) => o.setName("memberupdate").setDescription("for development purposes. ignore this."))
        )
        .addSubcommand((c) =>
            c
                .setName("remove")
                .setDescription("Remove a driver.")
                .addStringOption((o) => o.setName("steamid").setDescription("Driver's SteamID.").setRequired(true))
                .addStringOption((o) => o.setName("type").setDescription("removed or left").addChoices({
                    name: "left",
                    value: "left"
                }, {
                    name: "removed",
                    value: "removed"
                }).setRequired(true))
                .addStringOption((o) => o.setName("reason").setDescription("\"...left Dulcis Logistics due to <TEXTHERE>\"").setRequired(true))
                .addBooleanOption((o) => o.setName("giveretiredrole").setDescription("yes").setRequired(true))
                .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account."))
                .addBooleanOption((o) => o.setName("memberupdate").setDescription("for development purposes. ignore this."))
        )
        .setDefaultMemberPermissions(8)
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        const command = interaction.options.getSubcommand();
        const navio = new Navio(config.navio_api_key);
        const memberupdate = interaction.options.getBoolean("memberupdate") ?? true;

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
                await append("✅ Driver added to Navio. Creating database document...");

                const document = await getUserDocumentBySteamId(steamId);
                document.discord_id = member.id;
                document.username = result.username;
                document.safeSave();
                await append("✅ Database entry created. Trying to give driver role...");

                const role = await member.roles.add(config.driver_role, `Driver added by ${interaction.user.tag}`).catch(() => false as const);
                let roletext = "✅ Driver role given.";
                if (!role) roletext = "❌ Failed to give driver role.";
                await append(roletext + " Trying to send member updates webhook...");

                if (memberupdate) {
                    let webhooktext = "✅ Member updates webhook sent.";
                    try {
                        const webhook = await getWebhook(
                            interaction.guild.channels.cache.get(config.member_updates_channel) as TextChannel,
                            "Member Updates"
                        );

                        await webhook.send({
                            embeds: [{
                                title: "Member Update",
                                description: `**[${interaction.options.getString("position")}]** ${member} has joined Dulcis Logistics as a driver.`,
                                color: 0x7d7a7a
                            }]
                        });
                    } catch {
                        webhooktext = "❌ Failed to send member updates webhook.";
                    };
                    await append(webhooktext);
                };

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
            const steamId = interaction.options.getString("steamid", true);
            const document = await getUserDocumentBySteamId(steamId);
            let user = interaction.options.getUser("user");

            await interaction.reply({
                embeds: [{
                    title: "Processing...",
                    description: "\u200b"
                }],
                ephemeral: true
            });

            if (!user && document.discord_id)
                user = await interaction.client.users.fetch(document.discord_id).catch(() => null);

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
                            value: user ? `${user} \`${user.tag}\` (\`${user.id}\`)` : document.username
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
                if (!member && document.discord_id)
                    member = await interaction.guild.members.fetch(document.discord_id).catch(() => null);
                const reason = interaction.options.getString("reason", true);
                const type = interaction.options.getString("type", true);

                const { append } = await appendGenerator(interaction);
                await append("✅ Driver removed from Navio. Deleting database document...");

                await resetUserDocument(steamId);
                const updated = await Jobs.updateMany({ "driver.steam_id": steamId }, {
                    $unset: {
                        "driver.id": "",
                        "driver.steam_id": ""
                    },
                    $set: {
                        "driver.username": "Deleted User"
                    }
                });
                await append(`✅ Deleted database document and updated ${updated.modifiedCount} jobs. Trying to remove driver role...`);

                const role = await member?.roles.remove(
                    config.driver_role,
                    `Driver removed by ${interaction.user.tag}`
                ).catch(() => null);
                let roletext = "✅ Driver role removed.";
                if (!role) roletext = "❌ Failed to remove driver role.";
                await append(roletext + " Trying to send member updates webhook...");

                if (memberupdate) {
                    let webhooktext = "✅ Member updates webhook sent.";
                    try {
                        const webhook = await getWebhook(
                            interaction.guild.channels.cache.get(config.member_updates_channel) as TextChannel,
                            "Member Updates"
                        );

                        await webhook.send({
                            embeds: [{
                                title: "Member Update",
                                description: `**[Driver]** ${user ? user : document.username} has `
                                    + (type === "removed" ? "been removed from" : "left")
                                    + ` Dulcis Logistics due to ${reason}`,
                                color: 0x7d7a7a
                            }]
                        })
                    } catch {
                        webhooktext = "❌ Failed to send member updates webhook."
                    };

                    await append(webhooktext);
                };

                if (member && interaction.options.getBoolean("giveretiredrole", true))
                    await member.roles.add(config.retired_driver_role)
                        .then(() => append("✅ Gave retired driver role"))
                        .catch(() => append("❌ Failed to give retired driver role."));

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
                            value: user ? `${user} \`${user.tag}\` (\`${user.id}\`)` : document.username
                        }, {
                            name: "steamid",
                            value: `\`${steamId}\``
                        }, {
                            name: "type",
                            value: type
                        }, {
                            name: "reason",
                            value: reason
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