import fastify from "fastify";
import axios from "axios";
import crypto from "crypto";
import { config } from "..";
import { logger } from "../handlers/logger";
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
app.get("/vtc/members", async (req, res) => (await axios.get("https://api.truckersmp.com/v2/vtc/55939/members")).data);

app.post("/webhook/navio", async (req, res) => {
    console.log("header", req.headers["navio-signature"]);
    console.log("hmac", hmacSHA256(config.navio_secrets[0], (req.body as any).raw));

    if (req.headers["navio-signature"] !== hmacSHA256(config.navio_secrets[0], (req.body as any).raw)) return;
    if ((req.body as any).parsed.type !== "job.delivered") return;

    console.log(req.body);
});

app.get("*", async (req, res) => {
    return { message: "Hello World!", path: Object.values(req.params as object)[0] };
});

app.listen({ port: config.port, host: "0.0.0.0" }, (err, address) => {
    logger.info(`[WEB] Server live on ${address}`);
});

function hmacSHA256(key: string, data: any) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
};