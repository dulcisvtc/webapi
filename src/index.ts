import "dotenv/config";
import "./server";
import "./handlers/metrics";
import { Client, GatewayIntentBits, Guild, TextChannel } from "discord.js";
import { registerCommands } from "./handlers/commands";
import { eventsTicker } from "./handlers/events";
import { connection } from "./database";
import { getLogger } from "./logger";
import { readdirSync } from "fs";
import { inspect } from "util";
import { join } from "path";
import BannedCron from "./handlers/BannedCron";
import config from "./config";

const discordLogger = getLogger("discord", true);
const databaseLogger = getLogger("database", true);
const generalLogger = getLogger("general", true);

export const admens = ["419892040726347776", "736719142345900195"];
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
import "./handlers/events";

export let guild: Guild | null = null;
export let botlogs: TextChannel | null = null;

client.once("ready", () => {
    discordLogger.info(`Logged in as ${client.user!.tag}`);

    eventsTicker.start();
    BannedCron.start();

    guild = client.guilds.cache.get(config.guild)!;
    botlogs = guild.channels.cache.get(config.botlogs_channel)! as TextChannel;

    guild.members.fetch().then(() => {
        discordLogger.info("Fetched members.");
    });
    registerCommands(guild).then((commands) => {
        discordLogger.info(`Registered ${commands.size} commands.`)
    });
});

for (const eventFileName of readdirSync(join(__dirname, "events")).filter((name) => name.endsWith(".js"))) {
    const eventFile = require(`./events/${eventFileName}`).default;
    const eventName = eventFileName.split(".")[0]!;

    client[eventFile.once ? "once" : "on"](eventName, (...params) => eventFile.execute(...params));
};

connection.then(() => {
    databaseLogger.info("Connected to database.");
    return void client.login(config.token);
});

process.on("unhandledRejection", (e) => generalLogger.error(`unhandledRejection:\n${inspect(e)}`));
process.on("uncaughtException", (e) => generalLogger.error(`uncaughtException:\n${inspect(e)}`));