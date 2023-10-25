import { Event, EventDocument } from "./models/Event";

export async function getEventDocument(eventId: number): Promise<EventDocument> {
  return (await Event.findOne({ id: eventId })) ?? new Event({ id: eventId });
}
