import { Inject, Injectable, forwardRef } from "@nestjs/common";
import type { APIGameEvent } from "@truckersmp_official/api-types/v2";
import { Event, getEventDocument } from "../../database";
import http from "../../lib/http";
import type { PostEventDto } from "./events.dtos";
import { EventsGateway } from "./events.gateway";

@Injectable()
export class EventsService {
    constructor(
        @Inject(forwardRef(() => EventsGateway))
        private eventsGateway: EventsGateway
    ) { };

    public async getEvents() {
        const events = await Event.find({}, "-_id -__v").sort({ departure: 1 }).lean();

        return events;
    };

    public async getTMPEvent(eventId: number) {
        const TMPEvent = (await http.get<{ response: APIGameEvent }>(`https://api.truckersmp.com/v2/events/${eventId}`, { retry: 5 })).data.response;

        return TMPEvent;
    };

    public async postEvent(
        data: PostEventDto
    ) {
        const document = await getEventDocument(data.eventId);

        document.location = data.location;
        document.destination = data.destination;
        document.meetup = data.meetup;
        document.departure = data.departure;
        document.slotId = data.slotId ?? "";
        document.slotImage = data.slotImage ?? "";
        document.note = data.note ?? "";

        const TMPEvent = await this.getTMPEvent(data.eventId);

        const wsEvent = {
            id: data.eventId,
            name: TMPEvent.name,
            banner: TMPEvent.banner,
            location: data.location,
            destination: data.destination,
            meetup: data.meetup,
            departure: data.departure,
            slot_id: data.slotId,
            slot_image: data.slotImage,
            note: data.note
        };

        if (document.isNew) {
            this.eventsGateway.server.emit("new event", wsEvent);
        } else {
            this.eventsGateway.server.emit("event updated", wsEvent);
        };

        await document.save();

        return { message: "OK" };
    };

    public async deleteEvent(
        eventId: number
    ) {
        const document = await Event.deleteOne({ id: eventId });

        if (document.deletedCount === 1) {
            this.eventsGateway.server.emit("event deleted", eventId);
        };

        return { message: "OK" };
    };
};