import fastify from "fastify";
import axios from "axios";
import { config } from "..";
import { logger } from "../handlers/logger";
const app = fastify();

app.get("/vtc/news", async (req, res) => (await axios.get("https://api.truckersmp.com/v2/vtc/55939/news")).data);

app.get("/vtc/members", async (req, res) => (await axios.get("https://api.truckersmp.com/v2/vtc/55939/members")).data);

app.get("*", async (req, res) => {
    return { message: "Hello World!", path: Object.values(req.params as object)[0] };
});

app.listen({ port: config.port, host: "0.0.0.0" }, (err, address) => {
    logger.info(`[WEB] Server live on ${address}`);
});