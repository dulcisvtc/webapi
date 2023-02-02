import { getGlobalDocument } from "../database/global";
import { latestFromMap } from "../constants/functions";
import { formatTimestamp } from "../constants/time";
import { Jobs, User } from "../database";
import { getLogger } from "../logger";
import { inspect } from "util";
import axios from "axios";

const metricsLogger = getLogger("metrics", true);

const task = async () => {
    try {
        const start = Date.now();

        const timestamp = Date.now();

        const dbjobs = (await Jobs.aggregate([{
            $group: {
                _id: null,
                driven_distance: { $sum: "$driven_distance" },
                fuel_used: { $sum: "$fuel_used" }
            }
        }]))[0] as { driven_distance: number; fuel_used: number };

        const mdistance = Math.round((await User.aggregate([{
            $group: {
                _id: null,
                distance: { $sum: "$leaderboard.monthly_mileage" }
            }
        }]))[0].distance);

        const drivers = await axios.get("https://api.dulcis.org/vtc/members").then(res => res.data.response.members_count) as number;
        const jobs = await Jobs.count();
        const distance = Math.round(dbjobs.driven_distance);
        const fuel = Math.round(dbjobs.fuel_used);

        const document = await getGlobalDocument();

        const [lastTimestamp] = latestFromMap(document.metrics.drivers);

        if (formatTimestamp(parseInt(lastTimestamp)) === formatTimestamp(timestamp)) {
            document.metrics.drivers.delete(lastTimestamp);
            document.metrics.jobs.delete(lastTimestamp);
            document.metrics.distance.delete(lastTimestamp);
            document.metrics.fuel.delete(lastTimestamp);

            document.metrics.drivers.set(timestamp.toString(), drivers);
            document.metrics.jobs.set(timestamp.toString(), jobs);
            document.metrics.distance.set(timestamp.toString(), distance);
            document.metrics.fuel.set(timestamp.toString(), fuel);
        } else {
            document.metrics.drivers.set(timestamp.toString(), drivers);
            document.metrics.jobs.set(timestamp.toString(), jobs);
            document.metrics.distance.set(timestamp.toString(), distance);
            document.metrics.fuel.set(timestamp.toString(), fuel);
        };

        if (formatTimestamp(parseInt(lastTimestamp), { day: false }) === formatTimestamp(timestamp, { day: false })) {
            document.metrics.mdistance.delete(lastTimestamp);

            document.metrics.mdistance.set(timestamp.toString(), mdistance);
        } else {
            document.metrics.mdistance.set(timestamp.toString(), mdistance);
        };

        document.safeSave();

        metricsLogger.debug(
            `Logged metrics (${Date.now() - start}ms): drivers=${drivers}, jobs=${jobs}, distance=${distance}, mdistance=${mdistance}, fuel=${fuel}`
        );
    } catch (err) {
        metricsLogger.error(`Metrics error: ${inspect(err, { depth: Infinity })}`);
    };
};

task();
setInterval(task, 1 * 60 * 1000);