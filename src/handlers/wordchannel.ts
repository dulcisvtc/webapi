import { GuildTextBasedChannel, Message } from "discord.js";
import { WordchannelSchema } from "../../types";
import { admens } from "../bot";
import { Wordchannel } from "../database/models/Wordchannel";

const data = {
    word: "",
    user: "",
    message: "",
    leaderboard: {}
} as WordchannelSchema;

const handler = async (message: Message) => {
    if (!data.message) {
        const newdata = (await Wordchannel.findOne())!;
        data.word = newdata.word;
        data.user = newdata.user;
        data.message = newdata.message;
        data.leaderboard = newdata.leaderboard;
    };

    if (
        message.content?.startsWith("!")
        && admens.includes(message.author.id)
    ) return;

    const clean = message.content?.toLowerCase().split(/\s/)[0].replace(/[^a-z]/gi, "");

    if (!clean) return queueDelete([message]);

    if (
        message.author.id === data.user
        || clean === data.word
        || clean.slice(0, 1) !== data.word.slice(-1)
    ) return queueDelete([message]);

    data.word = clean;
    data.user = message.author.id;
    data.message = message.id;
    if (!data.leaderboard[message.author.id]) data.leaderboard[message.author.id] = 0;
    data.leaderboard[message.author.id]++;

    save();
};

export { data, handler };

let saving = false;
function save() {
    if (saving) return;
    saving = true;

    Wordchannel.findOneAndUpdate({
        $set: data
    }).then(() => {
        setTimeout(() => saving = false, 5000)
    });
};

setInterval(async () => {
    if (!data.word) return;
    const a = await Wordchannel.findOneAndUpdate({
        $set: data
    });
}, 60 * 1000);

const bulks = new Map<string, Message[]>();
export function queueDelete(messages: Message[]): void {
    if (!messages.length) return;
    const channel = messages[0]!.channel as GuildTextBasedChannel;

    const bulk = bulks.get(channel.id);
    if (!bulk && messages.length === 1) {
        void messages[0]?.delete();
        bulks.set(channel.id, []);
    } else if (bulk) return void bulk.push(...messages);
    else bulks.set(channel.id, messages);

    return void setTimeout(() => bulkDelete(channel), 3500);
};

function bulkDelete(channel: GuildTextBasedChannel): void {
    const bulk = bulks.get(channel.id);
    if (!bulk?.length) return void bulks.delete(channel.id);

    if (bulk.length > 1) void channel.bulkDelete(bulk.slice(0, 100));
    else void bulk[0]!.delete();

    const newBulk = bulk.slice(100);
    if (!newBulk.length) return void bulks.delete(channel.id);

    bulks.set(channel.id, newBulk);
    return void setTimeout(() => bulkDelete(channel), 3500);
};