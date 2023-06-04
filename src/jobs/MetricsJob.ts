import { CronJob } from "cron";
import ChildHandler from "../lib/ChildHandler";
import { getLogger } from "../logger";

const metricsLogger = getLogger("metrics", true);

const MetricsJob = new CronJob("* * * * *", async () => {
    const child = new ChildHandler<Metrics>("dist/jobs/MetricsChild.js");

    const start = Date.now();
    const data = await child.getData();
    const end = Date.now();

    metricsLogger.debug(`Metrics job took ${end - start}ms ${JSON.stringify(data)}`);
});

export default MetricsJob;

export interface Metrics {
    drivers: number;
    jobs: number;
    distance: number;
    mdistance: number;
    fuel: number;
};