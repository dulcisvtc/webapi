import type { Message } from "discord.js";
import { getWordchannelDocument } from "../database";

export default {
  execute: async (message: Message) => {
    if (message.channel.id !== "1013146174120804413") return;

    const document = await getWordchannelDocument();

    if (message.id === document.message) {
      const newMessage = await message.channel.send(`<@${document.user}>: ${document.word}`);

      document.message = newMessage.id;

      await document.save();
    }
  },
};
