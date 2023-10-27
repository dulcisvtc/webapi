import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { APIPlayer } from "@truckersmp_official/api-types/v2";
import OAuth from "discord-oauth2";
import { Routes } from "discord.js";
import { setTimeout as sleep } from "timers/promises";
import { inspect } from "util";
import { botlogs, client } from "../..";
import config from "../../config";
import { latestFromMap, paginate } from "../../constants/functions";
import { isCurrentMonth, isToday } from "../../constants/time";
import {
  Jobs,
  Session,
  User,
  getGlobalDocument,
  getLinkedRoleUsers,
  getUserDocumentByDiscordId,
  updateOrCreateLinkedRoleUser,
} from "../../database";
import http from "../../lib/http";
import { getLogger } from "../../logger";
import { TasksGateway } from "../gateways/tasks.gateway";

const generalLogger = getLogger("general", true);

@Injectable()
export class TasksService {
  constructor(private tasksGateway: TasksGateway) {}

  metricsLogger = getLogger("metrics", true);
  logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_10_SECONDS)
  async cleanupSessions() {
    await Session.deleteMany({ expiresAt: { $lt: Date.now() } });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkBannedPlayers() {
    const drivers = await User.find({}, "steam_id discord_id banNotified").lean();
    const pages = paginate(drivers, 10);

    const banned: string[] = [];
    const notBanned: string[] = [];

    for (const page of pages) {
      await Promise.all(
        page.map(async (driver) => {
          const TMPPlayer = (
            await http
              .get<{ response: APIPlayer }>(`https://api.truckersmp.com/v2/player/${driver.steam_id}`, { retry: 3 })
              .catch(() => ({ data: { response: null } }))
          ).data.response;

          if (!TMPPlayer) {
            generalLogger.error(`Failed to fetch TMP player ${driver.steam_id}`);
            return;
          }

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
                until: ok ? ok * 1000 : 0,
              });

              await botlogs!.send({
                embeds: [
                  {
                    title: "Banned Driver",
                    description: `**[${TMPPlayer.name}](https://truckersmp.com/user/${
                      TMPPlayer.id
                    })** has been banned from TruckersMP ${ok ? `until <t:${ok}:F>` : "for permanent"}`,
                    color: 0x2f3136,
                    fields: [
                      {
                        name: "Steam ID",
                        value: driver.steam_id,
                        inline: true,
                      },
                      {
                        name: "Discord",
                        value: `${driver.discord_id} (<@${driver.discord_id}>)`,
                        inline: true,
                      },
                    ],
                  },
                ],
              });
            }
          }
        })
      );

      if (pages.indexOf(page) + 1 !== pages.length) await sleep(500);
    }

    await User.updateMany({ steam_id: { $in: notBanned } }, { banNotified: false });
    await User.updateMany({ steam_id: { $in: banned } }, { banNotified: true });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics() {
    const timestamp = Date.now().toString();

    const [jobs, drivers, document] = await Promise.all([
      Jobs.find({}, "stop_timestamp driven_distance fuel_used").lean(),
      User.countDocuments(),
      getGlobalDocument(),
    ]);

    let distance = 0;
    let mdistance = 0;
    let fuel = 0;

    for (const { stop_timestamp, driven_distance, fuel_used } of jobs) {
      distance += driven_distance;
      fuel += fuel_used;

      if (isCurrentMonth(stop_timestamp)) {
        mdistance += driven_distance;
      }
    }

    distance = Math.round(distance);
    mdistance = Math.round(mdistance);
    fuel = Math.round(fuel);

    const [lastTimestamp] = latestFromMap(document.metrics.drivers);

    if (isToday(parseInt(lastTimestamp))) {
      document.metrics.drivers.delete(lastTimestamp);
      document.metrics.jobs.delete(lastTimestamp);
      document.metrics.distance.delete(lastTimestamp);
      document.metrics.fuel.delete(lastTimestamp);
    }

    document.metrics.drivers.set(timestamp, drivers);
    document.metrics.jobs.set(timestamp, jobs.length);
    document.metrics.distance.set(timestamp, distance);
    document.metrics.fuel.set(timestamp, fuel);

    const [lastTimestamp2] = latestFromMap(document.metrics.mdistance);

    if (isCurrentMonth(parseInt(lastTimestamp2))) {
      document.metrics.mdistance.delete(lastTimestamp2);
    }

    document.metrics.mdistance.set(timestamp, mdistance);

    for (const [key] of document.metrics.drivers) {
      if (document.metrics.drivers.size > 30) {
        document.metrics.drivers.delete(key);
        document.metrics.jobs.delete(key);
        document.metrics.distance.delete(key);
        document.metrics.fuel.delete(key);
      } else {
        break;
      }
    }

    for (const [key] of document.metrics.mdistance) {
      if (document.metrics.mdistance.size > 12) {
        document.metrics.mdistance.delete(key);
      } else {
        break;
      }
    }

    await document.save();

    const d = {
      drivers,
      jobs: jobs.length,
      distance,
      mdistance,
      fuel,
    };

    const then = parseInt(timestamp);
    const now = Date.now();

    this.metricsLogger.debug(`Metrics job took ${now - then}ms ${JSON.stringify(d)}`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES) // Discord rate limit is 10k/10min, so unless we have 5k drivers, we're good.
  async updateLinkedRoles() {
    this.metricsLogger.debug("Updating linked roles");

    const linkedRoleUsers = await getLinkedRoleUsers();

    if (!linkedRoleUsers) throw new Error("Failed to fetch linked role users");

    linkedRoleUsers.forEach(async (linkedRoleUser) => {
      // Refresh Token if required
      if (Date.now() - linkedRoleUser.lastRefreshed.getTime() > 72000000) {
        // 72000000ms = 20 hours
        const discordOauth = new OAuth({
          clientId: config.discordOauth.clientId,
          clientSecret: config.discordOauth.clientSecret,
          redirectUri: config.discordOauth.redirectUri,
        });

        const token = await discordOauth
          .tokenRequest({
            refreshToken: linkedRoleUser.refresh_token,
            grantType: "refresh_token",
            scope: "identify role_connections.write",
          })
          .catch((err) => {
            this.logger.error(`Failed to refresh token for ${linkedRoleUser.discord_id}: ${inspect(err.response)}`);
          });

        if (!token) return;

        linkedRoleUser = await updateOrCreateLinkedRoleUser(linkedRoleUser.discord_id, token.access_token, token.refresh_token);
      }

      const driver = await getUserDocumentByDiscordId(linkedRoleUser.discord_id);
      if (!driver) {
        this.logger.error(`Could not find driver ${linkedRoleUser.discord_id}`);
        return;
      }

      const jobs = await Jobs.find({ "driver.steam_id": driver.steam_id }).count();

      // Update data
      client.rest
        .put(Routes.userApplicationRoleConnection(config.discordOauth.clientId), {
          body: {
            platform_name: "Dulcis Logistics Driver's Hub",
            platform_username: driver.username,
            metadata: {
              kms: driver.leaderboard.alltime_mileage,
              jobs: jobs,
            },
          },
          headers: {
            Authorization: `Bearer ${linkedRoleUser.access_token}`,
          },
        })
        .catch((err) => {
          this.logger.error(
            `Failed to update linked role for ${linkedRoleUser.discord_id} ${err.response?.status}: ${inspect(
              err.response?.data
            )}`
          );
        });
    });
  }
}
