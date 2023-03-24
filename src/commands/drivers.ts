import { ChatInputCommandInteraction, SlashCommandBuilder, TextChannel, User } from "discord.js";
import { getUserDocumentByDiscordId, getUserDocumentBySteamId, Jobs, resetUserDocument, UserDocument } from "../database";
import { getWebhook } from "../constants/functions";
import { botlogs } from "..";
import Navio from "../lib/navio";
import config from "../config";
import TrackSim from "tracksim.js";
import { AxiosError } from "axios";

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
                            description: e.message,
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
                            description: e.message
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