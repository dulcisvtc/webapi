import { getGlobalDocument } from "../database/global";
import { getLogger } from "../logger";
import { Jobs } from "../database";
import { inspect } from "util";
import axios from "axios";

const metricsLogger = getLogger("metrics", true);

const task = async () => {
    try {
        const start = Date.now();

        const timestamp = Date.now().toString();

        const dbjobs = (await Jobs.aggregate([{
            $group: {
                _id: null,
                driven_distance: { $sum: "$driven_distance" },
                fuel_used: { $sum: "$fuel_used" }
            }
        }]))[0] as { driven_distance: number, fuel_used: number };

        const drivers = await axios.get("https://api.dulcis.org/vtc/members").then(res => res.data.response.members_count) as number;
        const jobs = await Jobs.count();
        const distance = Math.round(dbjobs.driven_distance);
        const fuel = Math.round(dbjobs.fuel_used);

        const document = await getGlobalDocument();

        document.metrics.drivers.set(timestamp, drivers);
        document.metrics.jobs.set(timestamp, jobs);
        document.metrics.distance.set(timestamp, distance);
        document.metrics.fuel.set(timestamp, fuel);

        document.safeSave();

        metricsLogger.debug(`Logged metrics (${Date.now() - start}ms): drivers=${drivers}, jobs=${jobs}, distance=${distance}, fuel=${fuel}`);
    } catch (err) {
        metricsLogger.error(`Metrics error: ${inspect(err, { depth: Infinity })}`);
    };
};

task();
setInterval(task, 60000);