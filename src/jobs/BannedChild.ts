import type { APIPlayer } from "@truckersmp_official/api-types/v2";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { setTimeout as sleep } from "node:timers/promises";
import { inspect } from "util";
import config from "../config";
import { paginate } from "../constants/functions";
import { User, connection } from "../database";
import http from "../lib/http";
import type { Banned } from "./BannedJob";

(async () => {
    try {
        await connection;

        const client = new Client({ intents: [GatewayIntentBits.Guilds] });
        client.rest.setToken(config.token);

        const botlogs = await client.channels.fetch(config.botlogs_channel, {
            allowUnknownGuild: true,
            cache: false
        }) as TextChannel;

        const drivers = await User.find({}, "steam_id discord_id banNotified").lean();
        const pages = paginate(drivers, 10);

        const banned = [];
        const notBanned = [];

        for (const page of pages) {
            await Promise.all(page.map(async (driver) => {
                const TMPPlayer = (await http.get<{ response: APIPlayer }>(`https://api.truckersmp.com/v2/player/${driver.steam_id}`))
                    .data.response;

                if (!TMPPlayer.banned) {
                    notBanned.push(driver.steam_id);
                    if (driver.banNotified) await User.updateOne({ steam_id: driver.steam_id }, { banNotified: false });
                } else {
                    const newUntil = TMPPlayer.bannedUntil ? TMPPlayer.bannedUntil.split(" ").join("T") + "Z" : null;
                    const ok = newUntil ? Math.round(new Date(newUntil).getTime() / 1000) : null;
                    banned.push(driver.steam_id);
                    if (!driver.banNotified) {
                        const ae = await botlogs.send({
                            embeds: [{
                                title: "Banned Driver",
                                description: `**[${TMPPlayer.name}](https://truckersmp.com/user/${TMPPlayer.id})** has been banned from TruckersMP ${ok ? `until <t:${ok}:F>` : "for permanent"}`,
                                color: 0x2f3136,
                                fields: [{
                                    name: "Steam ID",
                                    value: driver.steam_id,
                                    inline: true
                                }, {
                                    name: "Discord",
                                    value: `${driver.discord_id} (<@${driver.discord_id}>)`,
                                    inline: true
                                }]
                            }]
                        });
                        if (!ae) return;

                        await User.updateOne({ steam_id: driver.steam_id }, { banNotified: true });
                    };
                };
            }));

            if (pages.indexOf(page) + 1 !== pages.length) await sleep(500);
        };

        process.send!({ drivers: drivers.length, banned: banned.length, notBanned: notBanned.length } satisfies Banned);

        process.exit();
    } catch (err) {
        throw new Error(`BannedChild: ${inspect(err)}`);
    };
})();