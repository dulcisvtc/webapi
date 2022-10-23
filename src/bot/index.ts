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
        && !config.dev
    ) return handler(message);

    let ae = "";
    if (config.dev) ae = "1";
    if (message.content.split(/\s/g)[0] === `${client.user!}${ae}`) {
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
    };
    if (
        [
            "1020074805795496026",  // dev suggestions
            "992921519812509828"    // driver suggestion
        ].includes(message.channelId)
        && !(
            message.content.startsWith(".")
            && message.member?.roles.cache.has("992928986189549709")
        )
    ) {
        await message.react("1005154785982431423"); // yes
        await message.react("1005154849555501126"); // no
    };
});

client.on("messageDelete", (message) => {
    if (
        message.channel.id === "1013146174120804413"
        && message.id === data.message
    ) message.channel.send(`<@${data.user}>: ${data.word}`);
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