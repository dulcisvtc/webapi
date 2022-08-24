import { JobSchema } from "../../types";
import { Jobs, Users } from "../database";
import { logger } from "./logger";

export const handleDelivery = async (job: JobSchema): Promise<number> => {
    if (job.driven_distance < 1) return 200;

    if (await Jobs.findOne({ job_id: job.job_id })) {
        logger.warn(`[WEB] Job ${job.job_id} already exists in database.`);
    } else await Jobs.create(job);

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