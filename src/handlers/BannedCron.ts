import type { APIPlayer } from "@truckersmp_official/api-types/v2";
import { CronJob } from "cron";
import { setTimeout as sleep } from "timers/promises";
import { botlogs } from "..";
import { paginate } from "../constants/functions";
import { User } from "../database";
import http from "../lib/http";
import { getLogger } from "../logger";

const bannedLogger = getLogger("banned", true);

const BannedCron = new CronJob("0 * * * *", async () => {
    const then = Date.now();
    const drivers = await User.find({});
    const pages = paginate(drivers, 10);

    bannedLogger.debug(`${pages.length} pages to fetch with total of ${drivers.length} drivers.`);

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
                    while (!botlogs) await sleep(50);
                    const ae = await botlogs?.send({
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

    const now = Date.now();

    bannedLogger.info(`Fetched ${drivers.length} drivers in ${now - then}ms. ${banned.length} banned, ${notBanned.length} not banned.`);
}, null, false, "Etc/UTC", null, true);

export default BannedCron;