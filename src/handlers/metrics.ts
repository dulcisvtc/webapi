import { getGlobalDocument } from "../database/global";
import { latestFromMap } from "../constants/functions";
import { formatTimestamp } from "../constants/time";
import { getLogger } from "../logger";
import { Jobs } from "../database";
import { inspect } from "util";
import axios from "axios";

const metricsLogger = getLogger("metrics", true);

const task = async () => {
    try {
        const timestamp = Date.now();

        const jobs = await Jobs
            .find()
            .select("driven_distance fuel_used stop_timestamp")
            .lean();

        const drivers = await axios.get("https://api.dulcis.org/vtc/members")
            .then(res => res.data.response.members_count) as number;
        const distance = Math.round(jobs.reduce((a, b) => a + b.driven_distance, 0));
        const mdistance = Math.round(
            jobs
                .filter(job => formatTimestamp(job.stop_timestamp, { day: false }) === formatTimestamp(timestamp, { day: false }))
                .reduce((a, b) => a + b.driven_distance, 0)
        );
        const fuel = Math.round(jobs.reduce((a, b) => a + b.fuel_used, 0));

        const document = await getGlobalDocument();

        const [lastTimestamp] = latestFromMap(document.metrics.drivers);

        if (formatTimestamp(parseInt(lastTimestamp)) === formatTimestamp(timestamp)) {
            document.metrics.drivers.delete(lastTimestamp);
            document.metrics.jobs.delete(lastTimestamp);
            document.metrics.distance.delete(lastTimestamp);
            document.metrics.fuel.delete(lastTimestamp);
        };

        document.metrics.drivers.set(timestamp.toString(), drivers);
        document.metrics.jobs.set(timestamp.toString(), jobs.length);
        document.metrics.distance.set(timestamp.toString(), distance);
        document.metrics.fuel.set(timestamp.toString(), fuel);

        const [lastTimestamp2] = latestFromMap(document.metrics.mdistance);

        if (formatTimestamp(parseInt(lastTimestamp2), { day: false }) === formatTimestamp(timestamp, { day: false })) {
            document.metrics.mdistance.delete(lastTimestamp);
        };

        document.metrics.mdistance.set(timestamp.toString(), mdistance);

        for (const [key] of document.metrics.drivers) {
            if (document.metrics.drivers.size > 30) {
                document.metrics.drivers.delete(key);
                document.metrics.jobs.delete(key);
                document.metrics.distance.delete(key);
                document.metrics.fuel.delete(key);
            } else {
                break;
            };
        };

        for (const [key] of document.metrics.mdistance) {
            if (document.metrics.mdistance.size > 12) {
                document.metrics.mdistance.delete(key);
            } else {
                break;
            };
        };

        document.safeSave();

        metricsLogger.debug(
            `Logged metrics (${Date.now() - timestamp}ms): drivers=${drivers}, jobs=${jobs.length}, distance=${distance}, mdistance=${mdistance}, fuel=${fuel}`
        );
    } catch (err) {
        metricsLogger.error(`Metrics error: ${inspect(err)}`);
    };
};

task();
setInterval(task, 1 * 60 * 1000);