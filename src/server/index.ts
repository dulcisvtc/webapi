import fastify from "fastify";
import axios from "axios";
import crypto from "crypto";
import JSONbigint from "json-bigint";
import { config } from "..";
import { logger } from "../handlers/logger";
import { Jobs, Users } from "../database/";
import { JobSchema, UserSchema } from "../../types";
import { handleDelivery } from "../handlers/jobs";
import { guild } from "../bot";
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
    JSONbigint.parse((await axios.get("https://api.truckersmp.com/v2/vtc/55939/members", { transformResponse: [data => data] })).data)
);

let cachedDocs: JobSchema[] = [];
let docsCacheExpire = Date.now();
app.get("/jobs", async (req, res) => {
    if (Date.now() >= docsCacheExpire) {
        const docs = await Jobs.find().lean().exec();
        for (const doc of docs) {
            // @ts-ignore
            delete doc._id;
            // @ts-ignore
            delete doc.__v;
        };

        cachedDocs = docs;
        docsCacheExpire = Date.now() + 30_000;
    };

    res.status(200).send(cachedDocs);
});

let cachedUsers: UserSchema[] = [];
let usersCacheExpire = Date.now();
app.get("/users", async (req, res) => {
    if (Date.now() >= usersCacheExpire) {
        const docs = await Users.find().lean().exec();
        for (const doc of docs) {
            // @ts-ignore
            delete doc._id;
            // @ts-ignore
            delete doc.__v;
        };

        cachedUsers = docs;
        usersCacheExpire = Date.now() + 30_000;
    };

    res.status(200).send(cachedUsers);
});
app.get("/users/:id", async (req, res) => {
    const id = (req.params as { id: string }).id;
    const user = await Users.findOne({ discord_id: id }).lean().exec();

    if (!user) {
        res.status(404).send({ error: "User not found" });
        return;
    };

    // @ts-ignore
    delete user._id;
    // @ts-ignore
    delete user.__v;

    res.status(200).send(user);
});
app.get("/isdriver/:id", async (req, res) => {
    const id = (req.params as { id: string }).id;

    return {
        isdriver: guild?.members.cache.get(id)?.roles.cache.has("992843245463818270") ?? false
    };
});

app.post("/webhook/navio", async (req, res) => {
    if (req.headers["navio-signature"] !== hmacSHA256(config.navio_secrets[0], (req.body as any).raw)) return res.code(401);
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
});
app.post("/setdiscordid", async (req, res) => {
    const { discord_id, steam_id, secret } = req.query as { discord_id?: string; steam_id?: string; secret: string };
    if (!discord_id || !steam_id || !secret) return;

    if (secret !== config.secret) return;

    const user = await Users.findOne({ steam_id });
    if (!user) return res.status(404);
    await user.update({ $set: { discord_id } });
    return res.status(200);
});

app.get("*", async (req, res) => {
    return { message: "Hello World!", path: Object.values(req.params as object)[0] };
});

app.listen({ port: config.port, host: "0.0.0.0" }, (err, address) => {
    logger.info(`Server live on ${address}`);
});

function hmacSHA256(key: string, data: any) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
};