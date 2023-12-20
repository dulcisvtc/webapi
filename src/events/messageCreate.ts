import type { Message } from "discord.js";
import { inspect } from "util";
import { admens } from "..";
import { handleMessage } from "../handlers/wordchannel";

export default {
  execute: async (message: Message) => {
    if (message.author.bot) return;
    if (message.channel.id === "1013146174120804413") return handleMessage(message);

    if (message.content.split(/\s/g)[0] === `${message.client.user!}`) {
      const [cmd, ...args] = message.content.slice(`${message.client.user!}`.length).trim().split(/\s/g);

      if (cmd === "eval" && admens.includes(message.author.id)) {
        const _ = message;
        _;
        let evaled;

        try {
          evaled = await eval(args.join(" "));
        } catch (e) {
          evaled = e;
        }

        const clean = inspect(evaled, { depth: 1 });

        const text = clean.length > 1980 ? `\`\`\`js\n${clean.slice(0, 1980) + "..."}\n\`\`\`` : `\`\`\`js\n${clean}\n\`\`\``;

        return void message.reply(text);
      }
    }

    if (
      [
        "1020074805795496026", // dev suggestions
        "992921519812509828", // driver suggestion
      ].includes(message.channelId) &&
      !(message.content.startsWith(".") && message.member?.roles.cache.has("992928986189549709"))
    ) {
      await message.react("1005154785982431423"); // yes
      await message.react("1005154849555501126"); // no
    }

    if (
      [
        "992906643392180344", // driver photo of the month
        "994366699627356250", // staff photo of the month
      ].includes(message.channelId) &&
      message.attachments.size
    )
      await message.react("✅");

    if (message.channelId === "1056213949642715136" && message.attachments.size) await message.react("😋");
  },
};
