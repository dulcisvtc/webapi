import "dotenv/config";
import "./server";
import "./handlers/metrics";
import { Client, GatewayIntentBits, Guild, TextChannel } from "discord.js";
import { registerCommands } from "./handlers/commands";
import { connection } from "./database";
import { getLogger } from "./logger";
import { readdirSync } from "fs";
import { inspect } from "util";
import { join } from "path";
import config from "./config";

const discordLogger = getLogger("discord", true);
const databaseLogger = getLogger("database", true);
const generalLogger = getLogger("general", true);

export const admens = ["419892040726347776"];
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
import "./handlers/events";
import { eventsTicker } from "./handlers/events";

export let guild: Guild | null = null;
export let botlogs: TextChannel | null = null;

client.once("ready", () => {
    discordLogger.info(`Logged in as ${client.user!.tag}`);

    eventsTicker.start();

    guild = client.guilds.cache.get(config.guild)!;
    botlogs = guild.channels.cache.get(config.botlogs_channel)! as TextChannel;

    guild.members.fetch({ force: true }).then(() => {
        discordLogger.info("Fetched members.");
    });
    registerCommands(guild).then((commands) => {
        discordLogger.info(`Registered ${commands.size} commands.`)
    });
});

for (const eventFileName of readdirSync(join(__dirname, "events")).filter((name) => name.endsWith(".js"))) {
    const eventFile = require(`./events/${eventFileName}`).default;
    const eventName = eventFileName.split(".")[0];

    if (eventFile.once) client.once(eventName, (...params) => eventFile.execute(...params));
    else client.on(eventName, (...params) => eventFile.execute(...params));
};

connection.then(() => {
    databaseLogger.info("Connected to database.");
    return client.login(config.token);
});

process.on("unhandledRejection", (e) => generalLogger.error(`unhandledRejection:\n${inspect(e)}`));
process.on("uncaughtException", (e) => generalLogger.error(`uncaughtException:\n${inspect(e)}`));