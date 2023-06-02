import { inspect } from "util";
import { latestFromMap } from "../constants/functions";
import { formatTimestamp } from "../constants/time";
import { Jobs, User, connection, getGlobalDocument } from "../database";
import { getLogger } from "../logger";

const metricsLogger = getLogger("metrics", true);

(async () => {
    try {
        await connection;

        const timestamp = Date.now();

        const dbjobs = await Jobs.find({}, "stop_timestamp driven_distance fuel_used").lean();
        const drivers = await User.countDocuments();

        const jobs = dbjobs.length;
        const distance = Math.round(dbjobs.reduce((acc, cur) => acc + cur.driven_distance, 0));
        const mdistance = Math.round(dbjobs
            .filter(job => formatTimestamp(job.stop_timestamp, { day: false }) === formatTimestamp(timestamp, { day: false }))
            .reduce((acc, cur) => acc + cur.driven_distance, 0));
        const fuel = Math.round(dbjobs.reduce((acc, cur) => acc + cur.fuel_used, 0));

        const document = await getGlobalDocument();

        const [lastTimestamp] = latestFromMap(document.metrics.drivers);

        if (formatTimestamp(parseInt(lastTimestamp)) === formatTimestamp(timestamp)) {
            document.metrics.drivers.delete(lastTimestamp);
            document.metrics.jobs.delete(lastTimestamp);
            document.metrics.distance.delete(lastTimestamp);
            document.metrics.fuel.delete(lastTimestamp);
        };

        document.metrics.drivers.set(timestamp.toString(), drivers);
        document.metrics.jobs.set(timestamp.toString(), jobs);
        document.metrics.distance.set(timestamp.toString(), distance);
        document.metrics.fuel.set(timestamp.toString(), fuel);

        const [lastTimestamp2] = latestFromMap(document.metrics.mdistance);

        if (formatTimestamp(parseInt(lastTimestamp2), { day: false }) === formatTimestamp(timestamp, { day: false })) {
            document.metrics.mdistance.delete(lastTimestamp2);
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

        await document.save();

        metricsLogger.debug(
            `Logged metrics (${Date.now() - timestamp}ms): drivers=${drivers}, jobs=${jobs}, distance=${distance}, mdistance=${mdistance}, fuel=${fuel}`
        );

        process.exit(0);
    } catch (err) {
        metricsLogger.error(`Metrics error: ${inspect(err)}`);
    };
})();