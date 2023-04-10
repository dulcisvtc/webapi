import { ActionRowBuilder, ChatInputCommandInteraction, InteractionCollector, InteractionType, ModalBuilder, SlashCommandBuilder, TextChannel, TextInputBuilder, TextInputStyle, User } from "discord.js";
import { getUserDocumentByDiscordId, getUserDocumentBySteamId, Jobs, resetUserDocument, UserDocument } from "../database";
import { generateId } from "../constants/functions";
import { getWebhook } from "../constants/functions";
import { AxiosError } from "axios";
import { botlogs } from "..";
import TrackSim from "tracksim.js";
import Navio from "../lib/navio";
import config from "../config";
import { getLogger } from "../logger";
import dedent from "dedent";

const dbLogger = getLogger("database", true);

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
                .addStringOption((o) => o.setName("type").setDescription("removed or left").addChoices({
                    name: "left",
                    value: "left"
                }, {
                    name: "removed",
                    value: "removed"
                }).setRequired(true))
                .addStringOption((o) => o.setName("reason").setDescription("\"...left Dulcis Logistics due to <TEXTHERE>\"").setRequired(true))
                .addBooleanOption((o) => o.setName("giveretiredrole").setDescription("yes").setRequired(true))
                .addStringOption((o) => o.setName("steamid").setDescription("Driver's SteamID."))
                .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account."))
                .addBooleanOption((o) => o.setName("memberupdate").setDescription("for development purposes. ignore this."))
        )
        .addSubcommand((c) =>
            c
                .setName("edit")
                .setDescription("Edit a driver's information.")
                .addStringOption((o) => o.setName("steamid").setDescription("Driver's SteamID."))
                .addUserOption((o) => o.setName("user").setDescription("Driver's Discord account."))
        )
        .setDefaultMemberPermissions(8)
        .toJSON(),
    execute: async (interaction: ChatInputCommandInteraction<"cached">) => {
        const command = interaction.options.getSubcommand();
        const track = new TrackSim(config.tracksim_api_key);
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

            try {
                const driver = await track.drivers.add(steamId);

                const { append } = await appendGenerator(interaction);
                await append("✅ Driver added to TrackSim. Creating database document...");

                const document = await getUserDocumentBySteamId(steamId);
                document.discord_id = member.id;
                document.username = driver.username;
                document.safeSave();
                await append("✅ Database entry created. Trying to give driver role...");

                const role = await member.roles.add(config.driver_role, `Driver added by ${interaction.user.tag}`).catch(() => null);
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

                    let dmtext = "✅ DM sent.";
                    try {
                        await member.send({
                            embeds: [{
                                title: "Welcome to Dulcis Logistics!",
                                description: dedent`
                                    Congratulations, ${member}! Your application at Dulcis Logistics has been accepted.
                                    Please read the <#992844255657742377> and <#992841702345801810> channels to get started.

                                    If you have any questions, feel free to ask in <#992837899559125105>.
                                `
                            }]
                        });
                    } catch {
                        dmtext = "❌ Failed to send DM.";
                    };
                    await append(dmtext);
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
            } catch (e) {
                if (e instanceof AxiosError) {
                    await botlogs?.send({
                        embeds: [{
                            title: "error when adding a driver",
                            author: {
                                name: interaction.user.tag,
                                icon_url: interaction.user.displayAvatarURL()
                            },
                            description: e.response?.data?.error?.message || e.message,
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
                            description: e.response?.data?.error?.message || e.message
                        }]
                    });
                };

                throw e;
            };
        } else if (command === "remove") {
            let steamId = interaction.options.getString("steamid") as string;
            let user = interaction.options.getUser("user") as User;

            if (!steamId && !user) return interaction.reply({
                content: "You must provide either a SteamID or a Discord user.",
                ephemeral: true
            });

            let document: UserDocument | null = null;
            if (user) document = await getUserDocumentByDiscordId(user.id);
            else if (steamId) document = await getUserDocumentBySteamId(steamId, true);

            if (!document) return interaction.reply({
                content: "This user is not a driver.",
                ephemeral: true
            });

            if (!steamId) steamId = document.steam_id;
            if (!user) user = await interaction.client.users.fetch(document.discord_id);

            await interaction.reply({
                embeds: [{
                    title: "Processing...",
                    description: "\u200b"
                }],
                ephemeral: true
            });

            const { append } = await appendGenerator(interaction);

            const navio_result = await navio.removeDriver(steamId);
            const tracksim_result = await track.drivers.remove(steamId).catch((e) => {
                if (e instanceof AxiosError) {
                    return e.message;
                };

                return null
            });

            if (typeof navio_result === "string")
                await append(`❌ Failed to remove driver from Navio: ${navio_result}`);
            else await append("✅ Removed driver from Navio.");
            if (tracksim_result !== 200)
                await append(`❌ Failed to remove driver from TrackSim: ${tracksim_result}`);
            else await append("✅ Removed driver from TrackSim.");

            let member = interaction.options.getMember("user");
            if (!member && document.discord_id)
                member = await interaction.guild.members.fetch(document.discord_id).catch(() => null);

            const reason = interaction.options.getString("reason", true);
            const type = interaction.options.getString("type", true);

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
                            description: `**[Driver]** ${user ? user : document.username ?? "Unknown User"} has `
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
                        value: user ? `${user} \`${user.tag}\` (\`${user.id}\`)` : document.username ?? "Unknown User"
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
        } else if (command === "edit") {
            let steamId = interaction.options.getString("steamid") as string;
            let user = interaction.options.getUser("user") as User;

            if (!steamId && !user) return interaction.reply({
                content: "You must provide either a SteamID or a Discord user.",
                ephemeral: true
            });

            let document: UserDocument | null = null;

            if (user) document = await getUserDocumentByDiscordId(user.id);
            else if (steamId) document = await getUserDocumentBySteamId(steamId, true);

            if (!document) return interaction.reply({
                content: "This user is not a driver.",
                ephemeral: true
            });

            if (!steamId) steamId = document.steam_id;
            if (!user) user = await interaction.client.users.fetch(document.discord_id);

            const randomIdentifier = generateId(6);

            const modal = new ModalBuilder().setTitle(`Editing ${user.tag} (${steamId})`).setCustomId(randomIdentifier);

            const fields = [
                new TextInputBuilder()
                    .setCustomId("username")
                    .setPlaceholder("Username")
                    .setStyle(TextInputStyle.Short)
                    .setLabel("Username")
                    .setRequired(true)
                    .setValue(document.username),
                new TextInputBuilder()
                    .setCustomId("steamid")
                    .setPlaceholder("SteamID")
                    .setStyle(TextInputStyle.Short)
                    .setLabel("SteamID")
                    .setMinLength(17)
                    .setMaxLength(17)
                    .setRequired(true)
                    .setValue(steamId),
                new TextInputBuilder()
                    .setCustomId("discordid")
                    .setPlaceholder("DiscordID")
                    .setStyle(TextInputStyle.Short)
                    .setLabel("DiscordID")
                    .setMinLength(17)
                    .setRequired(true)
                    .setValue(document.discord_id),
                new TextInputBuilder()
                    .setCustomId("monthly_distance")
                    .setPlaceholder("Monthly Distance")
                    .setStyle(TextInputStyle.Short)
                    .setLabel("Monthly Distance")
                    .setRequired(true)
                    .setValue(document.leaderboard.monthly_mileage.toString()),
                new TextInputBuilder()
                    .setCustomId("alltime_distance")
                    .setPlaceholder("All-Time Distance")
                    .setStyle(TextInputStyle.Short)
                    .setLabel("All-Time Distance")
                    .setRequired(true)
                    .setValue(document.leaderboard.alltime_mileage.toString())
            ].map(f => new ActionRowBuilder<TextInputBuilder>().addComponents(f));

            modal.addComponents(fields);

            await interaction.showModal(modal);

            const collector = new InteractionCollector(interaction.client, {
                filter: i => i.customId === randomIdentifier && i.user.id === interaction.user.id,
                interactionType: InteractionType.ModalSubmit,
                time: 60000
            });

            collector.on("collect", async (i) => {
                if (i.isModalSubmit()) {
                    const fields = i.fields;

                    const username = fields.getTextInputValue("username");
                    const steamid = fields.getTextInputValue("steamid");
                    const discordid = fields.getTextInputValue("discordid");
                    const monthly_distance = fields.getTextInputValue("monthly_distance");
                    const alltime_distance = fields.getTextInputValue("alltime_distance");

                    if (isNaN(parseInt(monthly_distance)) || isNaN(parseInt(alltime_distance)))
                        return void i.reply({
                            content: "Monthly and all-time distance must be a number.",
                            ephemeral: true
                        });

                    if (document!.discord_id !== discordid) {
                        const user = await interaction.client.users.fetch(discordid).catch(() => null);

                        if (!user) return void i.reply({
                            content: "This user does not exist.",
                            ephemeral: true
                        });

                        const oldMember = await interaction.guild.members.fetch(document!.discord_id).catch(() => null);
                        const member = await interaction.guild.members.fetch(user).catch(() => null);

                        if (!member) return void i.reply({
                            content: "This user is not a member of this server.",
                            ephemeral: true
                        });

                        await member.roles.add(config.driver_role).catch(() => null);
                        if (oldMember) {
                            await oldMember.roles.remove(config.driver_role).catch(() => null);
                        };
                    };

                    dbLogger.debug(dedent`Updating driver ${document!.steam_id} (${document!.username}):
                        username: ${document!.username} -> ${username}
                        steamid: ${document!.steam_id} -> ${steamid}
                        discordid: ${document!.discord_id} -> ${discordid}
                        monthly_distance: ${document!.leaderboard.monthly_mileage} -> ${monthly_distance}
                        alltime_distance: ${document!.leaderboard.alltime_mileage} -> ${alltime_distance}
                    `);

                    document!.username = username;
                    document!.steam_id = steamid;
                    document!.discord_id = discordid;
                    document!.leaderboard.monthly_mileage = parseInt(monthly_distance);
                    document!.leaderboard.alltime_mileage = parseInt(alltime_distance);

                    document!.safeSave();

                    await i.reply({
                        content: "Successfully updated driver. If something was updated accidentally, please contact a developer.",
                        ephemeral: true
                    });

                    collector.stop();
                };
            });
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