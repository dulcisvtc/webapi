import { getWordchannelDocument } from "../database";
import { queueDelete } from "../constants/functions";
import type { Message } from "discord.js";
import { admens } from "..";

const handleMessage = async (message: Message) => {
    const document = await getWordchannelDocument();

    if (
        message.content.startsWith("!")
        && admens.includes(message.author.id)
    ) return;

    const clean = message.content.toLowerCase().split(/\s/)[0]?.replace(/[^a-z]/gi, "");
    if (!clean) return queueDelete([message]);

    if (
        message.author.id === document.user
        || clean === document.word
        || clean.slice(0, 1) !== document.word.slice(-1)
    ) return queueDelete([message]);

    document.word = clean;
    document.user = message.author.id;
    document.message = message.id;
    document.leaderboard.set(message.author.id, (document.leaderboard.get(message.author.id) ?? 0) + 1);

    await document.save();
};

export { handleMessage };