import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Event, getEventDocument } from "../../database";
import { TMPService } from "./tmp.service";
import type { PostEventDto } from "../dtos/events.dtos";
import { EventsGateway } from "../gateways/events.gateway";

@Injectable()
export class EventsService {
  constructor(
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
    private tmpService: TMPService
  ) {}

  public async getEvents() {
    const events = await Event.find({}, "-_id -__v").sort({ departure: 1 }).lean();

    return events;
  }

  public async postEvent(data: PostEventDto) {
    const document = await getEventDocument(data.eventId);

    document.location = data.location;
    document.destination = data.destination;
    document.meetup = data.meetup;
    document.departure = data.departure;
    document.slotId = data.slotId ?? "";
    document.slotImage = data.slotImage ?? "";
    document.notes = data.notes ?? "";

    const TMPEvent = (await this.tmpService.getEvent(data.eventId)).response;

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
      notes: data.notes,
    };

    if (document.isNew) {
      this.eventsGateway.server.emit("new event", wsEvent);
    } else {
      this.eventsGateway.server.emit("event updated", wsEvent);
    }

    await document.save();

    return { message: "OK" };
  }

  public async deleteEvent(eventId: number) {
    const document = await Event.deleteOne({ id: eventId });

    if (document.deletedCount === 1) {
      this.eventsGateway.server.emit("event deleted", eventId);
    }

    return { message: "OK" };
  }
}
