import { EmbedBuilder, Message, type Client } from "discord.js";
import moment from "moment";
import ms from "ms";
import { getTMPEvent } from "../constants/functions";
import { Slot, SlotDocument } from "../database";

export default async function updateSlots(client: Client, eventId?: number) {
    let documents: SlotDocument[] = [];
    if (eventId) {
        const document = await Slot.findOne({ eventId });
        if (document) documents.push(document);
    };

    if (!documents.length) documents = await Slot.find();

    for (const document of documents) {
        let needsUpdate = false;
        const infoChannel = client.channels.cache.get(document.infoChannelId);
        const slotsChannel = client.channels.cache.get(document.slotsChannelId);

        if (
            !infoChannel ||
            !slotsChannel ||
            !infoChannel.isTextBased() ||
            !slotsChannel.isTextBased()
        ) break;

        const event = await getTMPEvent(document.eventId);
        const offset = moment(Date.now()).utcOffset() * 60 * 1000;
        const departureTimestamp = moment(event.start_at).add(offset).toDate().getTime();
        const meetupTimestamp = departureTimestamp - ms("45m");
        const departure = Math.floor(departureTimestamp / 1000);
        const meetup = Math.floor(meetupTimestamp / 1000);

        const embeds = [
            new EmbedBuilder()
                .setTitle(event.name)
                .setURL(`https://truckersmp.com/events/${event.id}`),
            new EmbedBuilder()
                .setTitle("Convoy Info")
                .setDescription([
                    "**Starting location:**",
                    `${event.departure.city} (${event.departure.location})`,
                    "**Destination:**",
                    `${event.arrive.city} (${event.arrive.location})`,
                    "",
                    `**Meetup time:** <t:${meetup}:f>`,
                    `**Departure time:** <t:${departure}:f>`,
                    "",
                    "**Game:**",
                    event.game,
                    "**Server:**",
                    event.server.name,
                ].join("\n")),
            new EmbedBuilder()
                .setTitle("Route")
                .setImage(event.map),
            new EmbedBuilder()
                .setTitle("Links")
                .setDescription([
                    `[Twitter](https://twitter.com/DulcisVTC)`,
                    `[Instagram](https://www.instagram.com/dulcislogistics)`,
                    `[Disccord](https://dulcis.org/discord)`
                ].join("\n\n"))
        ];

        const msg = (await infoChannel.messages.fetch({ limit: 10 })).find((msg) => msg.author.id === client.user!.id && msg.embeds.length === 4);
        try {
            if (!msg) {
                await infoChannel.send({ embeds });
            } else {
                await msg.edit({ embeds });
            };
        } catch (e) {
            console.error(e);
        };

        for (const chunk of document.chunks) {
            const embeds = await Promise.all([
                new EmbedBuilder()
                    .setTitle(event.name)
                    .setDescription([
                        `Below are the slots for the [${event.name}](https://truckersmp.com/events/${event.id}) event on <t:${departure}:D>.`,
                        "If you wish to book a slot please make an [Event Management](https://discord.com/channels/992837897466167317/993193956357722193/1041371729462820896) ticket."
                    ].join("\n"))
                    .setURL(`https://truckersmp.com/events/${event.id}`),
                ...chunk.locations.map(async (location) => {
                    const slots = [...location.slots.entries()];

                    const description = slots.reduce((acc, [slot, { displayName, taken, vtcId }]) => {
                        const name = taken
                            ? vtcId
                                ? `[${displayName}](https://truckersmp.com/vtc/${vtcId})`
                                : displayName
                            : "*Available*";

                        return acc + `**${slot}** - ${name}\n`;
                    }, "");

                    return new EmbedBuilder()
                        .setTitle(location.name)
                        .setDescription(description)
                        .setImage(location.imageUrl);
                })
            ]);

            let message: Message;
            try {
                if (!chunk.messageId) throw new Error("No message ID");
                message = await slotsChannel.messages.fetch(chunk.messageId);
            } catch {
                message = await slotsChannel.send({ embeds });
                chunk.messageId = message.id;
                needsUpdate = true;
                break;
            };

            await message.edit({ embeds });
        };

        if (needsUpdate) await document.save();
    };
};