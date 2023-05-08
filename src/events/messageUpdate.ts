import { getWordchannelDocument } from "../database";
import { queueDelete } from "../constants/functions";
import type { Message } from "discord.js";

export default {
    execute: async (_: any, message: Message) => {
        if (message.channel.id !== "1013146174120804413") return;
        if (message.partial) await message.fetch();

        const document = await getWordchannelDocument();

        if (message.id === document.message) {
            const clean = message.content!.toLowerCase().split(/\s/)[0]!.replace(/[^a-z]/gi, "");

            if (clean.slice(0, 1) !== document.word.slice(-1)) {
                const newMessage = await message.channel.send(`<@${document.user}>: ${document.word}`);
                document.message = newMessage.id;

                await document.save();

                return queueDelete([message as Message]);
            };

            document.word = clean;

            await document.save();
        };
    }
};