import { getWordchannelDocument } from "../database";
import { Message } from "discord.js";

export default {
    execute: async (message: Message) => {
        if (message.channel.id !== "1013146174120804413") return;

        const document = await getWordchannelDocument();

        if (message.id === document.message) {
            const newMessage = await message.channel.send(`<@${document.user}>: ${document.word}`);

            document.message = newMessage.id;

            document.safeSave();
        };
    }
};