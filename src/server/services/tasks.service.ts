import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { APIPlayer } from "@truckersmp_official/api-types/v2";
import { setTimeout as sleep } from "timers/promises";
import { botlogs } from "../..";
import { paginate } from "../../constants/functions";
import { Session, User } from "../../database";
import http from "../../lib/http";
import { TasksGateway } from "../gateways/tasks.gateway";

@Injectable()
export class TasksService {
    constructor(private tasksGateway: TasksGateway) { };

    @Cron(CronExpression.EVERY_10_SECONDS)
    async cleanupSessions() {
        await Session.deleteMany({ expiresAt: { $lt: Date.now() } });
    };

    @Cron(CronExpression.EVERY_10_MINUTES)
    async checkBannedPlayers() {
        const drivers = await User.find({}, "steam_id discord_id banNotified").lean();
        const pages = paginate(drivers, 10);

        const banned: string[] = [];
        const notBanned: string[] = [];

        for (const page of pages) {
            await Promise.all(page.map(async (driver) => {
                const TMPPlayer = (
                    await http.get<{ response: APIPlayer }>(`https://api.truckersmp.com/v2/player/${driver.steam_id}`, { retry: 3 })
                        .catch(() => ({ data: { response: null } }))
                ).data.response;

                if (!TMPPlayer) return;

                if (!TMPPlayer.banned) {
                    notBanned.push(driver.steam_id);
                } else {
                    const newUntil = TMPPlayer.bannedUntil ? TMPPlayer.bannedUntil.split(" ").join("T") + "Z" : null;
                    const ok = newUntil ? Math.round(new Date(newUntil).getTime() / 1000) : null;

                    banned.push(driver.steam_id);

                    if (!driver.banNotified) {
                        this.tasksGateway.server.emit("player banned", {
                            steamId: driver.steam_id,
                            discordId: driver.discord_id,
                            tmpId: TMPPlayer.id,
                            until: ok ? ok * 1000 : 0
                        });

                        await botlogs!.send({
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
                    };
                };
            }));

            if (pages.indexOf(page) + 1 !== pages.length) await sleep(500);
        };

        await User.updateMany({ steam_id: { $in: notBanned }, banNotified: true }, { banNotified: false });
        await User.updateMany({ steam_id: { $in: banned }, banNotified: false }, { banNotified: true });
    };
};