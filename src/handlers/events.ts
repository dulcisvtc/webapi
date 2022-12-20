import { APIGameEvent, APIWebRouteBases, APIWebRoutes } from "@truckersmp_official/api-types/v2";
import { Event } from "../database/models/Event";
import { TextChannel } from "discord.js";
import { client } from "..";
import Ticker from "../lib/ticker";
import config from "../config";
import Axios from "axios";

export const eventsTicker = new Ticker(60_000);
const axios = Axios.create({
    baseURL: APIWebRouteBases.api
});

eventsTicker.on("tick", async () => {
    if (!process.env["EVENTS_CALENDAR_CHANNEL"]) return;

    const events = await Event.find();
    const calendarDescription = (await Promise.all(events.sort((a, b) => a.departure - b.departure).map(async (event) => {
        const apiEvent = await axios.get<{ response: APIGameEvent; }>(APIWebRoutes.event(event.id));
        const departureDate = new Date(event.departure)

        let string = [
            `**${departureDate.getUTCDate()}/${departureDate.getUTCMonth() + 1}/${departureDate.getUTCFullYear()}**`,
            "-",
            `[${apiEvent.data.response.name}](https://truckersmp.com/events/${event.id})`
        ].join(" ");

        if (Date.now() > event.departure + 1000 * 60 * 60 * 6) string = `~~${string}~~`;

        return string;
    }))).join("\n");

    const calendarChannel = client.channels.cache.get(config.event_channels.calendar)! as TextChannel;
    const message = (await calendarChannel.messages.fetch({ limit: 5 })).find((m) => m.author.id === client.user!.id);

    if (message) await message.edit({
        embeds: [{
            title: `Event calendar`,
            description: calendarDescription || "Empty."
        }]
    });
    else calendarChannel.send({
        embeds: [{
            title: `Event calendar`,
            description: calendarDescription || "Empty."
        }]
    });
});