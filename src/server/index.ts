import { User, UserDocument } from "../database/models/User";
import { handleDelivery } from "../handlers/jobs";
import { paginate } from "../constants/functions";
import { logger } from "../logger/normal";
import { JobSchema } from "../../types";
import { Jobs } from "../database/";
import { inspect } from "util";
import { guild } from "..";
import JSONbigint from "json-bigint";
import config from "../config";
import fastify from "fastify";
import crypto from "crypto";
import axios from "axios";

const app = fastify();

app.addHook("preHandler", (req, res, done) => {
    res.header("Access-Control-Allow-Origin", "*");
    done();
});

app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    try {
        const newBody = {
            raw: body,
            parsed: JSON.parse(body as string),
        };
        done(null, newBody);
    } catch (e) { logger.error(e); };
});

app.get("/vtc/news", async (req, res) => (await axios.get("https://api.truckersmp.com/v2/vtc/55939/news")).data);
app.get("/vtc/members", async (req, res) =>
    JSONbigint.parse((await axios.get("https://api.truckersmp.com/v2/vtc/55939/members", { transformResponse: (data) => data })).data)
);

let cachedJobs: JobSchema[] = [];
let jobsCacheExpire = Date.now();
app.get("/jobs", async (req, res) => {
    if (Date.now() >= jobsCacheExpire) {
        const docs = await Jobs.find().lean();

        for (const doc of docs) {
            // @ts-ignore
            delete doc._id;
            // @ts-ignore
            delete doc.__v;
        };

        cachedJobs = docs;
        jobsCacheExpire = Date.now() + 60_000;
    };

    const { page, perPage } = req.query as { page?: string; perPage?: string; };
    const pageNum = parseInt(page ?? "");
    const pageSize = parseInt(perPage ?? "");

    if (pageNum || pageNum === 0) {
        const pages = paginate(cachedJobs.sort((a, b) => b.stop_timestamp - a.stop_timestamp), pageSize || 25);

        return res.send(pages[pageNum]);
    };

    res.send(cachedJobs);
});

let cachedUsers: UserDocument[] = [];
let usersCacheExpire = Date.now();
app.get("/users", async (req, res) => {
    if (Date.now() >= usersCacheExpire) {
        const documents = JSON.parse(JSON.stringify(await User.find()));

        for (const document of documents) {
            delete document.__v;
            delete document._id;
        };

        cachedUsers = documents;
        usersCacheExpire = Date.now() + 30_000;
    };

    res.status(200).send(cachedUsers);
});
app.get("/users/:id", async (req, res) => {
    const id = (req.params as { id: string }).id;

    let user = cachedUsers.find((x) => x.discord_id === id) ?? await User.findOne({ discord_id: id });

    if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
    };

    res.status(200).send(user);
});
app.get("/isdriver/:id", async (req, res) => {
    const id = (req.params as { id: string }).id;

    return {
        isdriver: guild?.members.cache.get(id)?.roles.cache.has(config.driver_role) ?? false
    };
});
app.get("/setdiscordid", async (req, res) => {
    const { discord_id, steam_id, secret } = req.query as { discord_id?: string; steam_id?: string; secret?: string };
    if (!discord_id || !steam_id || !secret) return;

    if (secret !== config.messaging_secret) return;

    const user = await User.findOne({ steam_id });
    if (!user) return res.status(404).send({ message: "User not found" });
    await user.updateOne({ $set: { discord_id } });

    return res.status(200).send("a");
});

app.post("/webhook/navio", async (req, res) => {
    try {
        if (!config.navio_secrets.some((secret) =>
            req.headers["navio-signature"] === hmacSHA256(secret, (req.body as any).raw)
        )) return res.code(401);

        if ((req.body as any).parsed.type !== "job.delivered") return res.code(400);

        const parsed = (req.body as any).parsed;
        const job = parsed.data.object;
        const newJobObject: JobSchema = {
            job_id: job.id,
            driver: {
                id: job.driver.id,
                steam_id: job.driver.steam_id,
                username: job.driver.username
            },
            start_timestamp: new Date(job.start_time).getTime(),
            stop_timestamp: new Date(job.stop_time).getTime(),
            driven_distance: job.driven_distance,
            fuel_used: job.fuel_used,
            cargo: {
                name: job.cargo.name,
                mass: job.cargo.mass,
                damage: job.cargo.damage
            },
            source_city: job.source_city.name,
            source_company: job.source_company.name,
            destination_city: job.destination_city.name,
            destination_company: job.destination_company.name,
            truck: `${job.truck.brand.name} ${job.truck.name}`,
            average_speed: job.truck.average_speed * 3.6,
            top_speed: job.truck.top_speed * 3.6
        };

        const status = await handleDelivery(newJobObject);

        return res.status(status).send();
    } catch (e) { logger.error(inspect(e)); };
});

app.listen({ port: config.port, host: "0.0.0.0" }, (err, address) => {
    logger.info(`Server live on ${address}`);
});

function hmacSHA256(key: string, data: any) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
};