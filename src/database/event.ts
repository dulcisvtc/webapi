import { Event, EventDocument } from "./models/Event";

export async function getEventDocument(eventId: number): Promise<EventDocument | null> {
    return await Event.findOne({ id: eventId });
};