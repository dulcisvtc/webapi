import { Client, GatewayIntentBits, Guild, Message } from "discord.js";
import { inspect } from "util";
import { config } from "..";
import { logger } from "../handlers/logger";
import { data, handler, queueDelete } from "../handlers/wordchannel";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
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

export const admens = ["419892040726347776"];
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (
        message.channel.id === "1013146174120804413"
        // && !config.dev
    ) return handler(message);

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

        return void message.reply(text);
    };
});

client.on("messageDelete", (message) => {
    if (
        message.channel.id === "1013146174120804413"
        && message.id === data.message
    ) {
        message.channel.send(`<@${data.user}>: ${data.word}`);
    };
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (
        newMessage.channel.id === "1013146174120804413"
        && newMessage.id === data.message
    ) {
        const clean = newMessage.content?.toLowerCase().split(/\s/)[0].replace(/[^a-z]/gi, "");

        if (clean !== data.word) {
            const m = await newMessage.channel.send(`<@${data.user}>: ${data.word}`);
            data.message = m.id;

            queueDelete([newMessage as Message]);
        };
    };
});

client.login(config.token);