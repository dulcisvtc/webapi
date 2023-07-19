import { CronJob } from "cron";
import ChildHandler from "../lib/ChildHandler";

const SessionCleanupJob = new CronJob("*/10 * * * * *", async () => {
    const child = new ChildHandler("dist/jobs/SessionCleanupChild.js");

    await child.run();
}); // , null, false, "Etc/UTC", null, true

import "./SessionCleanupChild";

export default SessionCleanupJob;