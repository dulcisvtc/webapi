import { Client, GatewayIntentBits, Guild } from "discord.js";
import { config } from "..";
import { logger } from "../handlers/logger";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

export let guild: Guild | null = null;

client.once("ready", () => {
    logger.info("Connected to Discord");

    guild = client.guilds.cache.get("992837897466167317")!;

    guild.members.fetch({ force: true }).then(() => {
        logger.info("Fetched members");
    });
});

client.login(config.token);