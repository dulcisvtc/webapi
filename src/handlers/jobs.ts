import { EmbedBuilder, GuildTextBasedChannel } from "discord.js";
import { getUserDocumentBySteamId, Jobs } from "../database";
import { JobSchema } from "../../types";
import { getLogger } from "../logger";
import { inspect } from "util";
import { client } from "..";

const jobsLogger = getLogger("jobs", true);

export const handleDelivery = async (job: JobSchema): Promise<200> => {
    if (job.driven_distance < 1) return 200;

    if (await Jobs.findOne({ job_id: job.job_id })) {
        jobsLogger.warn(`Job ${job.job_id} already exists in database.`);
    } else {
        await Jobs.create(job);

        jobsLogger.debug(`Job delivered:\n${inspect(job, { depth: Infinity })}`);

        const channel = client.channels.cache.get("992906515809828914") as GuildTextBasedChannel;
        const embed = new EmbedBuilder()
            .setTitle("Job delivered!")
            .setURL("https://dulcis.org/hub/jobs?utm_source=discord&utm_medium=job_delivered_message")
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

        await channel.send({ embeds: [embed] })
            .catch((e) => jobsLogger.error(`Failed to send job delivered message:\n${inspect(e, { depth: Infinity })}`));
    };

    const user = await getUserDocumentBySteamId(job.driver.steam_id);

    user.leaderboard.monthly_mileage += job.driven_distance;
    user.leaderboard.alltime_mileage += job.driven_distance;
    user.username = job.driver.username;

    user.safeSave();

    jobsLogger.debug(`Updated user ${user.username} (${user.steam_id})'s mileage:\n${inspect(user.leaderboard, { depth: Infinity })}`);

    return 200;
};