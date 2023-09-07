import type { APICompany, APIGameEvent } from "@truckersmp_official/api-types/v2";
import { ChannelType, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { getTMPEvent, getTMPVTC } from "../constants/functions";
import { Slot } from "../database";
import updateSlots from "../lib/updateSlots";

export default {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
        .addSubcommandGroup((group) => group
            .setName("create")
            .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
            .addSubcommand(c => c
                .setName("event")
                .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                .addIntegerOption(o => o
                    .setName("id")
                    .setDescription("tmp event id")
                    .setRequired(true)
                )
                .addChannelOption(o => o
                    .setName("info-channel")
                    .setDescription("channel to put event info in")
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)
                )
                .addChannelOption(o => o
                    .setName("slots-channel")
                    .setDescription("channel to put slots in")
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)
                )
            )
            .addSubcommand((c) => c
                .setName("location")
                .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                .addIntegerOption(o => o
                    .setName("id")
                    .setDescription("tmp event id")
                    .setRequired(true)
                    .setAutocomplete(true)
                )
                .addStringOption(o => o
                    .setName("name")
                    .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                    .setRequired(true)
                )
                .addStringOption(o => o
                    .setName("image-url")
                    .setDescription("direct image url")
                    .setRequired(true)
                )
                .addStringOption(o => o
                    .setName("slots")
                    .setDescription("list of slots separated by commas. e.g.: `1,2,3,4,5`")
                )
            )
        )
        .addSubcommand((c) => c
            .setName("set")
            .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
            .addIntegerOption((o) => o
                .setName("event-id")
                .setDescription("tmp event id")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((o) => o
                .setName("slot")
                .setDescription("slot number")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addIntegerOption((o) => o
                .setName("vtc-id")
                .setDescription("tmp vtc id")
                .setAutocomplete(true)
            )
            .addStringOption((o) => o
                .setName("display-name")
                .setDescription("display name. defaults to vtc name.")
            )
        )
        .addSubcommand((c) => c
            .setName("update")
            .setDescription("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
            .addIntegerOption((o) => o
                .setName("event-id")
                .setDescription("tmp event id")
                .setAutocomplete(true)
            )
        )
        .setDefaultMemberPermissions(8)
        .toJSON(),
    execute: async (interaction) => {
        const group = interaction.options.getSubcommandGroup() as "create" | null;
        const command = interaction.options.getSubcommand() as "event" | "location" | "set" | "update" | null;

        switch (group) {
            case "create": {
                switch (command) {
                    case "event": {
                        const eventId = interaction.options.getInteger("id", true);
                        const infoChannel = interaction.options.getChannel("info-channel", true, [ChannelType.GuildText]);
                        const slotsChannel = interaction.options.getChannel("slots-channel", true, [ChannelType.GuildText]);

                        await interaction.deferReply();

                        if (await Slot.findOne({ eventId })) return await interaction.editReply("Event already exists");

                        let event: APIGameEvent;
                        try {
                            event = await getTMPEvent(eventId);
                        } catch (err) {
                            return await interaction.editReply("Event not found");
                        };

                        const document = new Slot({
                            eventId,
                            infoChannelId: infoChannel.id,
                            slotsChannelId: slotsChannel.id
                        });

                        await document.save();

                        updateSlots(interaction.client, eventId).then(() => {
                            interaction.followUp("Slots updated");
                        });

                        return await interaction.editReply([
                            `Event created: [${event.name}](https://truckersmp.com${event.url})`,
                            `Info channel: ${infoChannel}`,
                            `Slots channel: ${slotsChannel}`
                        ].join("\n"));
                    };
                    case "location": {
                        const eventId = interaction.options.getInteger("id", true);
                        const name = interaction.options.getString("name", true);
                        const imageUrl = interaction.options.getString("image-url", true);
                        const slots = interaction.options.getString("slots") ?? "";

                        const mappedSlots = slots.split(",").map((s) => s.trim()).filter((s) => s.length);

                        await interaction.deferReply();

                        const document = await Slot.findOne({ eventId });
                        if (!document) return await interaction.editReply("Event not found");

                        const chunk = document.chunks.find((c) => c.locations.some((l) => l.name === name));
                        if (chunk) return await interaction.editReply("Location already exists");

                        let trigger = "none";
                        const s = document.chunks.some((c) => c.locations.some((l) => mappedSlots.some((s) => l.slots.has(s) && (trigger = s))));
                        if (s) return await interaction.editReply(`Slot \`${trigger}\` already exists`);

                        const obj = {
                            name,
                            imageUrl,
                            slots: new Map(mappedSlots.map((s) => [s, {
                                vtcId: 0,
                                taken: false,
                                displayName: ""
                            }]))
                        };

                        if (document.chunks.length) {
                            let added = false;
                            for (const chunk of document.chunks) {
                                if (chunk.locations.length < 8) {
                                    chunk.locations.push(obj);
                                    added = true;
                                    break;
                                };
                            };

                            if (!added) {
                                document.chunks.push({
                                    messageId: "",
                                    locations: [obj]
                                });
                            };
                        } else {
                            document.chunks = [{
                                messageId: "",
                                locations: [obj]
                            }];
                        };

                        await document.save();

                        updateSlots(interaction.client, eventId).then(() => {
                            interaction.followUp("Slots updated");
                        });

                        return await interaction.editReply([
                            `Location created: ${name}`,
                            `Image url: ${imageUrl}`,
                            `Slots: ${mappedSlots}`
                        ].join("\n"));
                    };
                };
                break;
            };
            default: {
                switch (command) {
                    case "set": {
                        const eventId = interaction.options.getInteger("event-id", true);
                        const slot = interaction.options.getString("slot", true);
                        const vtcId = interaction.options.getInteger("vtc-id");
                        let displayName = interaction.options.getString("display-name");

                        if (!vtcId && !displayName) return await interaction.reply("You must provide either a vtc id or a display name");
                        if (vtcId && displayName) return await interaction.reply("You must provide either a vtc id or a display name, not both");

                        await interaction.deferReply();

                        const document = await Slot.findOne({ eventId });
                        if (!document) return await interaction.editReply("Event not found");

                        const chunk = document.chunks.find((c) => c.locations.some((l) => l.slots.has(slot)));
                        if (!chunk) return await interaction.editReply("Slot not found");

                        const location = chunk.locations.find((l) => l.slots.has(slot));
                        if (!location) return await interaction.editReply("Slot not found");

                        if (location.slots.get(slot)!.taken) return await interaction.editReply("Slot already taken");

                        let vtc: APICompany;
                        if (vtcId) {
                            try {
                                vtc = await getTMPVTC(vtcId);
                            } catch (err) {
                                return await interaction.editReply("VTC not found");
                            };

                            displayName ||= vtc.name;
                        };

                        location.slots.set(slot, {
                            vtcId: vtcId || 0,
                            taken: true,
                            displayName: displayName!
                        });

                        await document.save();

                        updateSlots(interaction.client, eventId).then(() => {
                            interaction.followUp("Slots updated");
                        });

                        const vtcText = vtcId ? `${vtcId} - [${vtc!.name}](https://truckersmp.com/vtc/${vtcId})` : "Non-VTC slot.";

                        return await interaction.editReply([
                            `Slot: ${slot}`,
                            `VTC: ${vtcText}`,
                            `Display name: ${displayName}`
                        ].join("\n"));
                    };
                    case "update": {
                        const eventId = interaction.options.getInteger("event-id");

                        await interaction.deferReply();

                        if (!eventId) {
                            const events = await Slot.find();
                            for (const event of events) {
                                await interaction.editReply(`Updating event ${event.eventId}`);
                                await updateSlots(interaction.client, event.eventId);
                            };
                        } else {
                            await interaction.editReply(`Updating event ${eventId}`);
                            await updateSlots(interaction.client, eventId);
                        };

                        return await interaction.editReply("Slots updated");
                    };
                };
            };
        };

        return;
    },
    autocomplete: async (interaction) => {
        const group = interaction.options.getSubcommandGroup() as "create" | null;
        const command = interaction.options.getSubcommand() as "event" | "location" | "set" | "update" | null;

        switch (group) {
            case "create": {
                switch (command) {
                    case "location": {
                        const eventId = interaction.options.getInteger("id", true);

                        const c = await Promise.all((await Slot.find()).filter(async (e) => {
                            return e.eventId.toString().includes(eventId.toString());
                        }).map(async (e) => {
                            return {
                                name: `${e.eventId} - ${(await getTMPEvent(e.eventId)).name}`,
                                value: e.eventId
                            };
                        }));
                        return await interaction.respond(c);
                    };
                };
                break;
            };
            default: {
                switch (command) {
                    case "set": {
                        const eventId = interaction.options.getInteger("event-id", true);
                        const slot = interaction.options.getString("slot");
                        const vtcId = interaction.options.getInteger("vtc-id");

                        const selected = interaction.options.getFocused(true).name as "event-id" | "slot" | "vtc-id";

                        let c: {
                            name: string;
                            value: number | string;
                        }[];
                        switch (selected) {
                            case "event-id": {
                                c = await Promise.all((await Slot.find()).filter(async (e) => {
                                    return e.eventId.toString().includes(eventId.toString());
                                }).map(async (e) => {
                                    return {
                                        name: `${e.eventId} - ${(await getTMPEvent(e.eventId)).name}`,
                                        value: e.eventId
                                    };
                                }));
                                break;
                            };
                            case "slot": {
                                if (!eventId) {
                                    c = [{
                                        name: "Fill in the event id first",
                                        value: ""
                                    }];
                                    break;
                                };

                                const s = await Slot.findOne({ eventId });
                                if (!s) {
                                    c = [{
                                        name: "Event not found",
                                        value: ""
                                    }];
                                    break;
                                };

                                c = s.chunks.flatMap((c) => {
                                    return c.locations.flatMap((l) => {
                                        return [...l.slots.keys()].filter((s) => s.includes(slot ?? "") && !l.slots.get(s)!.taken).map((s) => {
                                            return {
                                                name: s,
                                                value: s
                                            };
                                        });
                                    });
                                }).filter((s) => s.name).slice(0, 25);
                                if (!c.length) {
                                    c = [{
                                        name: "No slots found",
                                        value: ""
                                    }];
                                    break;
                                };
                                break;
                            };
                            case "vtc-id": {
                                if (!vtcId) return;
                                let vtc: APICompany;
                                try {
                                    vtc = await getTMPVTC(vtcId);
                                    c = [{
                                        name: `${vtc.id} - ${vtc.name} - ${vtc.members_count} drivers`,
                                        value: vtc.id
                                    }];
                                } catch (err) {
                                    c = [{
                                        name: "VTC not found",
                                        value: ""
                                    }];
                                    break;
                                };
                                break;
                            };
                        };

                        return await interaction.respond(c);
                    };
                    case "update": {
                        const eventId = interaction.options.getInteger("event-id")!;

                        const c = (await Slot.find()).filter((e) => {
                            return e.eventId.toString().includes(eventId.toString());
                        }).map((e) => {
                            return {
                                name: `${e.eventId} - ${e.chunks.length} chunks`,
                                value: e.eventId
                            };
                        });

                        return await interaction.respond(c);
                    };
                };
            };
        };
    }
} satisfies Command;