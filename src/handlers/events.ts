import { APICompany, APIGameEvent, APIPlayer, APIWebRouteBases, APIWebRoutes } from "@truckersmp_official/api-types/v2";
import Axios, { AxiosError } from "axios";
import { EmbedBuilder, TextChannel } from "discord.js";
import { setTimeout } from "node:timers/promises";
import { client } from "..";
import config from "../config";
import { formatTimestamp, isCurrentMonth, isToday } from "../constants/time";
import { Event } from "../database/models/Event";
import Ticker from "../lib/ticker";
import { getLogger } from "../logger";

const eventsLogger = getLogger("events", true);

export const eventsTicker = new Ticker(60_000);
const axios = Axios.create({
    baseURL: APIWebRouteBases.api
});

axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const { config, message } = error;

    if (!config || !config.retry)
        return Promise.reject(error);

    if (!message.includes("write EPROTO"))
        return Promise.reject(error);

    config.retry -= 1;

    await setTimeout(config.retryDelay ?? 500);

    return await axios(config);
});

eventsTicker.on("tick", async () => {
    if (!process.env["EVENTS_CALENDAR_CHANNEL"]) return;

    let events = await Event.find();
    const calendarDescription = (await Promise.all(
        events
            .filter((e) => isCurrentMonth(e.departure))
            .sort((a, b) => a.departure - b.departure)
            .map(async (event) => {
                const apiEvent = await axios.get<{ response: APIGameEvent; }>(APIWebRoutes.event(event.id), { retry: 10 })
                    .catch(async (e: AxiosError) => {
                        eventsLogger.error(`[calendar] Failed to fetch event ${event.id} (${e.response?.status ?? e.code}).`);

                        if (e.response?.status === 404) {
                            await Event.deleteOne({ id: event.id });
                            events = events.filter((e) => e.id !== event.id);
                        };
                    });
                if (!apiEvent) return;
                const departureDate = new Date(event.departure)

                let string = [
                    `**${formatTimestamp(departureDate.getTime())}**`,
                    "-",
                    `[${apiEvent.data.response.name}](https://truckersmp.com/events/${event.id})`
                ].join(" ");

                if (Date.now() > event.departure + 1000 * 60 * 60 * 6) string = `~~${string}~~`;

                return string;
            })
            .filter(async (e) => !!(await e))
    )).join("\n");

    const calendarChannel = client.channels.cache.get(config.event_channels.calendar)! as TextChannel;
    const message = (await calendarChannel.messages.fetch({ limit: 5 })).find((m) => m.author.id === client.user!.id);

    const calendarEmbed = new EmbedBuilder()
        .setTitle(`Event calendar for ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}`)
        .setDescription(calendarDescription || "Empty.")
        .setFooter({ text: "Last update" })
        .setTimestamp();

    if (message) {
        await message.edit({
            embeds: [calendarEmbed]
        });
    } else {
        await calendarChannel.send({
            embeds: [calendarEmbed]
        });
    };

    eventsLogger.debug("Updated event calendar.");

    const attendingChannel = client.channels.cache.get(config.event_channels.attending)! as TextChannel;
    const attendingMessage = (await attendingChannel.messages.fetch({ limit: 50 }))
        .find((m) => m.author.id === client.user!.id && m.embeds.length);

    const todayEvents = events
        .filter((event) => {
            return isToday(event.departure);
        });

    if (!todayEvents.length) return attendingMessage?.delete();

    const selectedEvent = todayEvents.length === 1
        ? todayEvents[0]!
        : todayEvents.reduce((prev, curr) => {
            const prevDeparture = new Date(prev.departure);
            const currDeparture = new Date(curr.departure);

            return Math.abs(prevDeparture.getTime() - Date.now()) < Math.abs(currDeparture.getTime() - Date.now())
                ? prev
                : curr;
        });

    const apiEvent = await axios.get<{ response: APIGameEvent; }>(APIWebRoutes.event(selectedEvent.id), { retry: 10 })
        .catch((e: AxiosError) => {
            eventsLogger.error(`[attending] Failed to fetch event ${selectedEvent.id} (${e.response?.status ?? e.code}).`);
        });

    if (!apiEvent) return;

    const descriptionArray = [
        `**Date:** <t:${Math.round(selectedEvent.departure / 1000)}:F>`,
        `**Meetup:** <t:${Math.round(selectedEvent.meetup / 1000)}:R>`,
        `**Departure:** <t:${Math.round(selectedEvent.departure / 1000)}:R>`,
        `**Start location:** ${selectedEvent.location}`,
        `**Destination:** ${selectedEvent.destination}`,
        `**Server:** ${apiEvent.data.response.server.name}`,
        // @ts-expect-error - TMP API returns an empty array if there are no DLCs
        `**DLC required:** ${apiEvent.data.response.dlcs.length === 0 ? "None." : Object.values(apiEvent.data.response.dlcs).join(", ")}`,
        `**Slot:** ${selectedEvent.slotId || "None."}`
    ];

    const thumbnailUrl = apiEvent.data.response.vtc?.id
        ? (await axios.get<{ response: APICompany }>(APIWebRoutes.company(apiEvent.data.response.vtc.id))).data.response.logo
        // @ts-expect-error - smh, bigints
        : (await axios.get<{ response: APIPlayer }>(APIWebRoutes.player(apiEvent.data.response.user.id))).data.response.avatar;

    const attendingEmbed = new EmbedBuilder()
        .setTitle(apiEvent.data.response.name)
        .setURL(`https://truckersmp.com/events/${selectedEvent.id}`)
        .setDescription(descriptionArray.join("\n\n"))
        .setThumbnail(thumbnailUrl)
        .setImage(apiEvent.data.response.map)
        .setFooter({ text: "Last update" })
        .setTimestamp();

    let deleted = false;
    if (attendingMessage && attendingMessage.embeds[0]?.title !== apiEvent.data.response.name)
        await attendingMessage.delete().then(() => deleted = true);

    if (attendingMessage && !deleted) await attendingMessage.edit({
        embeds: selectedEvent.slotImage ? [
            attendingEmbed, {
                image: {
                    url: selectedEvent.slotImage
                }
            }] : [attendingEmbed]
    });
    else await attendingChannel.send({
        embeds: selectedEvent.slotImage ? [
            attendingEmbed, {
                image: {
                    url: selectedEvent.slotImage
                }
            }] : [attendingEmbed]
    });

    if (
        Date.now() < selectedEvent.departure &&
        selectedEvent.departure - Date.now() < 1000 * 60 * 30 &&
        selectedEvent.departure - Date.now() > 1000 * 60 * 29
    ) {
        const mentionMessage = (await attendingChannel.messages.fetch({ limit: 50 }))
            .find((m) => m.author.id === client.user!.id && m.content.includes("<@&"));

        if (!mentionMessage) await attendingChannel.send({
            content: [
                "<@&994010840732803073>",
                "The convoy departs in **30 minutes**! Please be there if you can ❤️"
            ].join("\n\n")
        });
    };

    eventsLogger.debug(`Updated attending message for event ${selectedEvent.id}.`);
    return;
});