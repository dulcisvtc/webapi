import { Client, GatewayIntentBits, Guild } from "discord.js";
import { inspect } from "util";
import { config } from "..";
import { logger } from "../handlers/logger";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
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

const admens = ["419892040726347776"];
client.on("messageCreate", async (message) => {
    let ae = "";
    if (config.dev) ae = "1";
    if (message.content.split(/\s/g)[0] !== `${client.user!}${ae}`) return;

    const [cmd, ...args] = message.content.slice(`${client.user!}${ae}`.length).trim().split(/\s/g);

    if (cmd === "eval" && admens.includes(message.author.id)) {
        const _ = message;
        let evaled;
        try {
            evaled = await eval(args.join(" "));
        } catch (e) {
            evaled = e;
        };
        const clean = inspect(evaled, { depth: 1 });

        const text = clean.length > 1980 ? `\`\`\`js\n${clean.slice(0, 1980) + "..."}\n\`\`\`` : `\`\`\`js\n${clean}\n\`\`\``;

        message.reply(text);
    };
});

client.login(config.token);