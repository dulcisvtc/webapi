import "dotenv/config";
import "./server";
import { Client, GatewayIntentBits, Guild, TextChannel } from "discord.js";
import { connection } from "./database";
import { registerCommands } from "./handlers/commands";
import { logger } from "./logger/normal";
import { readdirSync } from "fs";
import { inspect } from "util";
import { join } from "path";
import config from "./config";
import { debug } from "./logger/debug";

export const admens = ["419892040726347776"];
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

export let guild: Guild | null = null;
export let botlogs: TextChannel | null = null;

client.once("ready", () => {
    logger.info(`Logged in as ${client.user!.tag}`);

    guild = client.guilds.cache.get(config.guild)!;
    botlogs = guild.channels.cache.get(config.botlogs_channel)! as TextChannel;

    guild.members.fetch({ force: true }).then(() => {
        logger.info("Fetched members.");
    });
    registerCommands(guild).then((commands) => {
        logger.info(`Registered ${commands.size} commands.`)
    });
});

for (const eventFileName of readdirSync(join(__dirname, "events")).filter((name) => name.endsWith(".js"))) {
    const eventFile = require(`./events/${eventFileName}`).default;
    const eventName = eventFileName.split(".")[0];

    if (eventFile.once) client.once(eventName, (...params) => eventFile.execute(...params));
    else client.on(eventName, (...params) => eventFile.execute(...params));
};

connection.then(() => {
    logger.info("Connected to database.");
    return client.login(config.token);
});

client.on("debug", (m) => {
    debug.info(m);
});

process.on("unhandledRejection", (e) => logger.error("unhandledRejection:\n" + inspect(e)));
process.on("uncaughtException", (e) => logger.error("uncaughtException:\n" + inspect(e)));
logger.info("=".repeat(55));