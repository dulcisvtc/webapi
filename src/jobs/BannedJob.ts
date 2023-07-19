import { CronJob } from "cron";
import ChildHandler from "../lib/ChildHandler";
import { getLogger } from "../logger";

const bannedLogger = getLogger("banned", true);

const BannedCron = new CronJob("*/10 * * * *", async () => {
    const child = new ChildHandler<Banned>("dist/jobs/BannedChild.js");

    const start = Date.now();
    const data = await child.getData();
    const end = Date.now();

    bannedLogger.debug(`Fetched ${data.drivers} drivers in ${end - start}ms. ${data.banned} banned, ${data.notBanned} not banned.`);
}); // , null, false, "Etc/UTC", null, true

import "./BannedChild";

export default BannedCron;

export interface Banned {
    drivers: number;
    banned: number;
    notBanned: number;
};