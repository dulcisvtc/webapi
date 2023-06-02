import { fork } from "child_process";
import { CronJob } from "cron";

const BannedCron = new CronJob("* * * * *", () => {
    void fork(__dirname + "/../workers/metrics.js");
});

export default BannedCron;