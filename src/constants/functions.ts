import { GuildTextBasedChannel, Message, TextChannel } from "discord.js";

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

export async function getWebhook(channel: TextChannel, name: string) {
    const webhooks = await channel.fetchWebhooks();

    let webhook = webhooks.find((w) => w.name === name);
    if (!webhook) webhook = await channel.createWebhook({
        name,
        avatar: channel.client.user.displayAvatarURL()
    });

    return webhook;
};

export const paginate = <T>(arr: T[], itemsPerPage: number): T[][] => {
    return arr.reduce<T[][]>((acc, val, i) => {
        const idx = Math.floor(i / itemsPerPage);
        const page = acc[idx] || (acc[idx] = []);
        page.push(val);

        return acc;
    }, []);
};