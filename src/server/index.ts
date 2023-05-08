import { Event, EventDocument, getEventDocument, getGlobalDocument, getUserDocumentBySteamId, GlobalDocument, Jobs, User, UserDocument } from "../database/";
import type { JobSchema, TrackSimJobWebhookObject } from "../../types";
import type { APIGameEvent } from "@truckersmp_official/api-types/v2";
import { handleDelivery } from "../handlers/jobs";
import { getLogger } from "../logger";
import { inspect } from "util";
import { client } from "..";
import JSONbigint from "json-bigint";
import config from "../config";
import http from "../lib/http";
import fastify from "fastify";
import crypto from "crypto";
import WebSocket from "ws";
import axios from "axios";

const webLogger = getLogger("web", true);
const app = fastify();

app.addHook("preHandler", (_req, res, done) => {
    res.header("Access-Control-Allow-Origin", "*");
    done();
});

app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    try {
        const newBody = {
            raw: body,
            parsed: JSON.parse(body as string),
        };
        done(null, newBody);
    } catch (e) { webLogger.error(e); };
});

app.get("/vtc/news", async (_req, _res) => (await axios.get("https://api.truckersmp.com/v2/vtc/55939/news")).data);
app.get("/vtc/members", async (_req, _res) =>
    JSONbigint.parse((await axios.get("https://api.truckersmp.com/v2/vtc/55939/members", { transformResponse: (data) => data })).data)
);
app.get<{ Params: { id: string; }; }>("/tmp/event/:id", async (req, _res) =>
    JSONbigint.parse((await axios.get(
        `https://api.truckersmp.com/v2/events/${req.params.id}`,
        { transformResponse: (data) => data }
    )).data)
);

app.get("/jobs", async (req, res) => {
    const query = req.query as { limit?: string; skip?: string; steamids?: string; };

    const steamids = query.steamids?.split(",") ?? [];
    const limit = parseInt(query.limit || "10");
    const skip = parseInt(query.skip || "0");

    const filter = steamids.length
        ? { "driver.steam_id": { $in: steamids } }
        : {};

    const jobs = await Jobs.find(filter, "-_id -__v").sort({ stop_timestamp: -1 }).skip(skip).limit(limit);

    res.send(jobs);
});

let cachedUsers: UserDocument[] = [];
let usersCacheExpire = Date.now();
app.get("/users", async (_req, res) => {
    if (Date.now() >= usersCacheExpire) {
        cachedUsers = await User.find({}, "-_id -__v");
        usersCacheExpire = Date.now() + 30_000;
    };

    res.status(200).send(cachedUsers);
});
app.get<{ Params: { id: string; }; }>("/users/:id", async (req, res) => {
    if (Date.now() >= usersCacheExpire) cachedUsers.length = 0;

    const { id } = req.params;
    const user = cachedUsers.find((x) => x.discord_id === id) ?? await User.findOne({ discord_id: id });

    if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
    };

    res.status(200).send(user);
});

app.post("/user/username", async (req, res) => {
    if (req.headers["secret"] !== config.messaging_secret) return res.status(403);
    const { steam_id, username } = req.body as { steam_id?: string; username?: string; };

    if (!steam_id || !username) {
        return res.status(400).send({ message: "Missing required fields" });
    };

    const document = await getUserDocumentBySteamId(steam_id, true);
    if (!document) return res.status(404).send({ message: "User not found" });

    document.username = username;

    await document.save();

    return res.status(200).send({ message: "OK" });
});

let cachedEvents: EventDocument[] = [];
let eventsCacheExpire = Date.now();

const wss = new WebSocket.Server({ server: app.server });
wss.on("connection", async (ws, req) => {
    if (req.url !== "/events") return ws.close(1003, "Invalid URL");

    if (Date.now() >= eventsCacheExpire) {
        const documents = JSON.parse(JSON.stringify(await Event.find()));

        for (const document of documents) {
            delete document.__v;
            delete document._id;
        };

        cachedEvents = documents.sort((a: any, b: any) => a.departure - b.departure);
        eventsCacheExpire = Date.now() + 5_000;
    };

    await Promise.all(cachedEvents.map(async (x) => {
        const TMPEvent = (await http.get<{ response: APIGameEvent }>(`https://api.truckersmp.com/v2/events/${x.id}`, { retry: 5 })).data.response;

        ws.send(JSON.stringify({
            type: "new",
            event: {
                id: x.id,
                name: TMPEvent.name,
                banner: TMPEvent.banner,
                location: x.location,
                destination: x.destination,
                meetup: x.meetup,
                departure: x.departure,
                slot_id: x.slot_id,
                slot_image: x.slot_image
            }
        }));
    }));
});

app.get("/events", async (_req, res) => {
    if (Date.now() >= eventsCacheExpire) {
        const documents = JSON.parse(JSON.stringify(await Event.find()));

        for (const document of documents) {
            delete document.__v;
            delete document._id;
        };

        cachedEvents = documents.sort((a: any, b: any) => a.departure - b.departure);
        eventsCacheExpire = Date.now() + 5_000;
    };

    res.send(cachedEvents);
});
app.post("/events", async (req, res) => {
    if (req.headers["secret"] !== config.messaging_secret) return res.status(403);

    const eventObject = (req.body as any).parsed as {
        eventId: number;
        location: string;
        destination: string;
        meetup: number;
        departure: number;
        slotId?: number;
        slotImage?: string;
    };

    const event = await getEventDocument(eventObject.eventId);
    const isNew = event.isNew;
    const TMPEvent = (await http.get<{ response: APIGameEvent }>(`https://api.truckersmp.com/v2/events/${event.id}`, { retry: 5 })).data.response;

    const wsEvent = {
        id: eventObject.eventId,
        name: TMPEvent.name,
        banner: TMPEvent.banner,
        location: eventObject.location,
        destination: eventObject.destination,
        meetup: eventObject.meetup,
        departure: eventObject.departure,
        slot_id: eventObject.slotId,
        slot_image: eventObject.slotImage
    };

    if (isNew) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "new",
                    event: wsEvent
                }));
            };
        });
    } else {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "update",
                    event: wsEvent
                }));
            };
        });
    };

    event.location = eventObject.location;
    event.destination = eventObject.destination;
    event.meetup = eventObject.meetup;
    event.departure = eventObject.departure;

    eventObject.slotId && (event.slot_id = eventObject.slotId);
    eventObject.slotImage && (event.slot_image = eventObject.slotImage);

    await event.save();

    return res.status(200).send(event);
});
app.delete<{ Params: { id: string; }; }>("/events/:id", async (req, res) => {
    if (req.headers["secret"] !== config.messaging_secret) return res.status(403);

    const eventId = parseInt(req.params.id);
    const event = await getEventDocument(eventId);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "delete",
                event: {
                    id: eventId,
                    location: event.location,
                    destination: event.destination,
                    meetup: event.meetup,
                    departure: event.departure,
                    slot_id: event.slot_id,
                    slot_image: event.slot_image
                }
            }));
        };
    });

    await event.deleteOne();

    return res.status(200).send(event);
});

let cachedStaff: {
    name: string;
    color: string;
    members: {
        name: string;
        avatar: string;
    }[];
}[] = [];
let staffCacheExpire = Date.now();
app.get("/staff", async (_req, res) => {
    if (Date.now() >= staffCacheExpire) {
        const document = await getGlobalDocument();

        cachedStaff = await Promise.all([...document.staff.values()].map(async (r) => ({
            name: r.name,
            color: r.color,
            members: await Promise.all([...r.members.values()].map(async (m) => {
                const user = await client.users.fetch(m.id);

                return {
                    name: m.name ?? user.username,
                    avatar: user.displayAvatarURL({ extension: "png" })
                };
            }))
        })));
        staffCacheExpire = Date.now() + 60 * 60 * 1000;
    };

    res.send(cachedStaff);
});

let cachedStats: {
    drivers: number;
    jobs: number;
    mjobs: number;
    distance: number;
    mdistance: number;
    fuel: number;
};
let statsCacheExpire = Date.now();
app.get("/stats", async (_req, res) => {
    if (Date.now() >= statsCacheExpire) {
        const drivers = await User.count();

        const jobs = await Jobs.find().select("driven_distance fuel_used stop_timestamp -_id");
        const mjobs = jobs.filter((job) => job.stop_timestamp > new Date().setMonth(new Date().getMonth() - 1));

        const distance = Math.round(jobs.reduce((a, b) => a + b.driven_distance, 0));
        const mdistance = Math.round(mjobs.reduce((a, b) => a + b.driven_distance, 0));

        const fuel = Math.round(jobs.reduce((a, b) => a + b.fuel_used, 0));

        cachedStats = {
            drivers,
            jobs: jobs.length,
            mjobs: mjobs.length,
            distance,
            mdistance,
            fuel
        };

        statsCacheExpire = Date.now() + 60 * 1000;
    };

    res.send(cachedStats);
});

let cachedMetrics: GlobalDocument["metrics"];
let metricsCacheExpire = Date.now();
app.get("/metrics", async (_req, res) => {
    if (Date.now() >= metricsCacheExpire) {
        const document = await getGlobalDocument();

        cachedMetrics = document.metrics;
        staffCacheExpire = Date.now() + 30 * 1000;
    };

    res.send(cachedMetrics);
});

app.post("/webhook/tracksim", async (req, res) => {
    try {
        if (!config.tracksim_secrets.some((secret) =>
            req.headers["tracksim-signature"] === hmacSHA256(secret, (req.body as any).raw)
        )) return res.status(401).send();

        const parsed = (req.body as any).parsed as TrackSimJobWebhookObject;

        if (parsed.type !== "job.delivered") return res.status(400).send();

        const job = parsed.data.object;

        const newJobObject: JobSchema = {
            ts_job_id: job.id,
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
    } catch (e) {
        webLogger.error(`Failed to handle delivery:\n${inspect(e)}`);

        throw e;
    };
});

app.listen({ port: config.port, host: "0.0.0.0" }, (_err, address) => {
    webLogger.info(`Server live on ${address}`);
});

function hmacSHA256(key: string, data: any) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
};