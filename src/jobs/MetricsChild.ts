import { inspect } from "util";
import { latestFromMap } from "../constants/functions";
import { isCurrentMonth, isToday } from "../constants/time";
import { Jobs, User, connection, getGlobalDocument } from "../database";
import type { Metrics } from "./MetricsJob";

(async () => {
    try {
        await connection;

        const timestamp = Date.now();

        const dbjobs = await Jobs.find({}, "stop_timestamp driven_distance fuel_used").lean();
        const drivers = await User.countDocuments();
        const document = await getGlobalDocument();

        const jobs = dbjobs.length;
        let distance = 0;
        let mdistance = 0;
        let fuel = 0;

        for (const { stop_timestamp, driven_distance, fuel_used } of dbjobs) {
            distance += driven_distance;
            fuel += fuel_used;

            if (isCurrentMonth(stop_timestamp)) {
                mdistance += driven_distance;
            };
        };

        distance = Math.round(distance);
        mdistance = Math.round(mdistance);
        fuel = Math.round(fuel);

        const [lastTimestamp] = latestFromMap(document.metrics.drivers);

        if (isToday(parseInt(lastTimestamp))) {
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

        if (isCurrentMonth(parseInt(lastTimestamp2))) {
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

        process.send!({ drivers, jobs, distance, mdistance, fuel } satisfies Metrics);

        process.exit();
    } catch (err) {
        throw new Error(`MetricsChild: ${inspect(err)}`);
    };
})();