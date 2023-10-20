import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ForbiddenException, Inject, Injectable, type RawBodyRequest } from "@nestjs/common";
import type { Cache } from "cache-manager";
import crypto from "crypto";
import { EmbedBuilder, escapeMarkdown, type GuildTextBasedChannel } from "discord.js";
import type { Request } from "express";
import { inspect } from "util";
import { client } from "../..";
import type { JobSchema, TrackSimJobWebhookObject } from "../../../types";
import config from "../../config";
import { Jobs, getUserDocumentBySteamId } from "../../database";
import { getLogger } from "../../logger";

const jobsLogger = getLogger("jobs", true);

@Injectable()
export class WebhookService {
    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache
    ) { };

    async handleTracksim(
        req: RawBodyRequest<Request>,
        body: TrackSimJobWebhookObject
    ): Promise<any> {
        const rawBody = req.rawBody?.toString().trim();
        if (!rawBody) throw new ForbiddenException("No body");

        if (!config.tracksim_secrets.some((secret) =>
            req.headers["tracksim-signature"] === hmacSHA256(secret, rawBody)
        )) throw new ForbiddenException("Invalid signature");

        const job = body.data.object;

        const newJob: JobSchema = {
            ts_job_id: job.id,
            driver: {
                id: job.driver.id,
                steam_id: job.driver.steam_id,
                username: job.driver.username
            },
            start_timestamp: new Date(job.start_time).getTime(),
            stop_timestamp: new Date(job.stop_time).getTime(),
            driven_distance: job.driven_distance,
            fuel_used: job.fuel_used,
            cargo: {
                name: job.cargo.name,
                mass: job.cargo.mass,
                damage: job.cargo.damage
            },
            source_city: job.source_city.name,
            source_company: job.source_company.name,
            destination_city: job.destination_city.name,
            destination_company: job.destination_company.name,
            truck: `${job.truck.brand.name} ${job.truck.name}`,
            average_speed: job.truck.average_speed * 3.6,
            top_speed: job.truck.top_speed * 3.6
        };

        if (job.driven_distance < 1) return { message: "OK" };

        if (await Jobs.exists({ ts_job_id: newJob.ts_job_id })) {
            jobsLogger.warn(`Job ${newJob.ts_job_id} already exists in database.`);
            return { message: "OK" };
        };

        const user = await getUserDocumentBySteamId(job.driver.steam_id);
        if (job.fuel_used < 0) job.fuel_used = 0;

        await Jobs.create(job);

        jobsLogger.debug(`Job delivered:\n${inspect(job, { depth: Infinity })}`);

        const channel = client.channels.cache.get("992906515809828914") as GuildTextBasedChannel;
        const embed = new EmbedBuilder()
            .setTitle("Job delivered!")
            .setURL("https://hub.dulcis.org/jobs")
            .setDescription(`${escapeMarkdown(newJob.driver.username)} (<@${user.discord_id}>) | ${newJob.driven_distance.toFixed(2)}km`)
            .addFields({
                name: "Source",
                value: `${newJob.source_company} (${newJob.source_city})`,
                inline: true
            }, {
                name: "Destination",
                value: `${newJob.destination_company} (${newJob.destination_city})`,
                inline: true
            }, {
                name: "Cargo",
                value: `${newJob.cargo.name} | ${(newJob.cargo.mass / 1000).toFixed(1)}T | ${Math.round(newJob.cargo.damage * 100)}% damage`,
                inline: true
            }, {
                name: "Truck",
                value: `${newJob.truck}`,
                inline: true
            }, {
                name: "Speed",
                value: `max: ${newJob.top_speed.toFixed(1)}km/h | avg: ${newJob.average_speed.toFixed(1)}km/h`,
                inline: true
            }, {
                name: "Fuel used",
                value: `${newJob.fuel_used.toFixed(1)}L`,
                inline: true
            });

        user.leaderboard.monthly_mileage += newJob.driven_distance;
        user.leaderboard.alltime_mileage += newJob.driven_distance;

        await Promise.all([
            channel.send({ embeds: [embed] })
                .catch((e) => jobsLogger.error(`Failed to send job delivered message:\n${inspect(e)}`)),
            user.save(),
            this.cacheManager.del(`${user.steam_id}-banner`),
            this.cacheManager.del(`${user.discord_id}-banner`)
        ]);

        jobsLogger.debug(`Updated user ${user.username} (${user.steam_id})'s mileage:\n${inspect(user.leaderboard)}`);

        return { message: "OK" };
    };
};

function hmacSHA256(key: string, data: any) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
};