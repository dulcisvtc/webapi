import { APICompany, APIGameEvent, APIPlayer, APIWebRouteBases, APIWebRoutes } from "@truckersmp_official/api-types/v2";
import { EmbedBuilder, TextChannel } from "discord.js";
import { formatTimestamp } from "../constants/time";
import { Event } from "../database/models/Event";
import { getLogger } from "../logger";
import { client } from "..";
import Ticker from "../lib/ticker";
import config from "../config";
import Axios from "axios";

const eventsLogger = getLogger("events", true);

export const eventsTicker = new Ticker(60_000);
const axios = Axios.create({
    baseURL: APIWebRouteBases.api
});

eventsTicker.on("tick", async () => {
    if (!process.env["EVENTS_CALENDAR_CHANNEL"]) return;

    const events = await Event.find();
    const calendarDescription = (await Promise.all(
        events
            .filter((e) => formatTimestamp(e.departure, { day: false }) === formatTimestamp(Date.now(), { day: false }))
            .sort((a, b) => a.departure - b.departure)
            .map(async (event) => {
                const apiEvent = await axios.get<{ response: APIGameEvent; }>(APIWebRoutes.event(event.id));
                const departureDate = new Date(event.departure)

                let string = [
                    `**${formatTimestamp(departureDate.getTime())}**`,
                    "-",
                    `[${apiEvent.data.response.name}](https://truckersmp.com/events/${event.id})`
                ].join(" ");

                if (Date.now() > event.departure + 1000 * 60 * 60 * 6) string = `~~${string}~~`;

                return string;
            })
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
    const attendingMessage = (await attendingChannel.messages.fetch({ limit: 5 })).find((m) => m.author.id === client.user!.id);

    const todayEvents = events
        .filter((event) => {
            const departureDate = new Date(event.departure);
            const now = new Date();

            return formatTimestamp(departureDate.getTime()) === formatTimestamp(now.getTime());
        });

    if (!todayEvents.length) return attendingMessage?.delete();

    const selectedEvent = todayEvents.length === 1
        ? todayEvents[0]
        : todayEvents.reduce((prev, curr) => {
            const prevDeparture = new Date(prev.departure);
            const currDeparture = new Date(curr.departure);

            return Math.abs(prevDeparture.getTime() - Date.now()) < Math.abs(currDeparture.getTime() - Date.now())
                ? prev
                : curr;
        });

    const apiEvent = await axios.get<{ response: APIGameEvent; }>(APIWebRoutes.event(selectedEvent.id));

    const descriptionArray = [
        `**Date:** <t:${Math.round(selectedEvent.departure / 1000)}:F>`,
        `**Meetup:** <t:${Math.round(selectedEvent.meetup / 1000)}:R>`,
        `**Departure:** <t:${Math.round(selectedEvent.departure / 1000)}:R>`,
        `**Start location:** ${selectedEvent.location}`,
        `**Destination:** ${selectedEvent.destination}`,
        `**Server:** ${apiEvent.data.response.server.name}`,
        // @ts-expect-error - TMP API returns an empty array if there are no DLCs
        `**DLC required:** ${apiEvent.data.response.dlcs.length === 0 ? "None." : Object.values(apiEvent.data.response.dlcs).join(", ")}`,
        `**Slot:** ${selectedEvent.slot_id || "None."}`
    ];

    const thumbnailUrl = apiEvent.data.response.vtc
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

    if (attendingMessage) await attendingMessage.edit({
        embeds: selectedEvent.slot_image ? [
            attendingEmbed, {
                image: {
                    url: selectedEvent.slot_image
                }
            }] : [attendingEmbed]
    });
    else await attendingChannel.send({
        embeds: selectedEvent.slot_image ? [
            attendingEmbed, {
                image: {
                    url: selectedEvent.slot_image
                }
            }] : [attendingEmbed]
    });

    eventsLogger.debug(`Updated attending message for event ${selectedEvent.id}.`);
});