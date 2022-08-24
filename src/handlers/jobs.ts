import { EmbedBuilder, GuildTextBasedChannel } from "discord.js";
import { JobSchema } from "../../types";
import { client } from "../bot";
import { Jobs, Users } from "../database";
import { logger } from "./logger";

export const handleDelivery = async (job: JobSchema): Promise<number> => {
    if (job.driven_distance < 1) return 200;

    if (await Jobs.findOne({ job_id: job.job_id })) {
        logger.warn(`[WEB] Job ${job.job_id} already exists in database.`);
    } else {
        await Jobs.create(job);

        const channel = client.channels.cache.get("992906515809828914") as GuildTextBasedChannel;
        const embed = new EmbedBuilder()
            .setTitle("Job delivered!")
            .setDescription(`${job.driver.username} | ${job.driven_distance.toFixed(2)}km`)
            .addFields({
                name: "Source",
                value: `${job.source_company} (${job.source_city})`,
                inline: true
            }, {
                name: "Destination",
                value: `${job.destination_company} (${job.destination_city})`,
                inline: true
            }, {
                name: "Cargo",
                value: `${job.cargo.name} | ${(job.cargo.mass / 1000).toFixed(1)}T | ${Math.round(job.cargo.damage * 100)}% damage`,
                inline: true
            }, {
                name: "Truck",
                value: `${job.truck}`,
                inline: true
            }, {
                name: "Speed",
                value: `max: ${job.top_speed.toFixed(1)}km/h | avg: ${job.average_speed.toFixed(1)}km/h`,
                inline: true
            }, {
                name: "Fuel used",
                value: `${job.fuel_used.toFixed(1)}L`,
                inline: true
            });

        await channel.send({ embeds: [embed] }).catch(() => logger.error("cannot send delivery message"));
    };

    const user = await Users.findOne({ steam_id: job.driver.steam_id });
    if (!user) {
        await Users.create({
            steam_id: job.driver.steam_id,
            username: job.driver.username,
            leaderboard: {
                monthly_mileage: job.driven_distance
            }
        });
    } else await user.updateOne({ $inc: { "leaderboard.monthly_mileage": job.driven_distance }, $set: { username: job.driver.username } });

    return 200;
};