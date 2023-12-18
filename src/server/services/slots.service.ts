import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { APICompany } from "@truckersmp_official/api-types/v2";
import { client } from "../..";
import { getTMPEvent, getTMPVTC } from "../../constants/functions";
import { Slot } from "../../database";
import updateSlots from "../../lib/updateSlots";
import type { PatchSlotsDto } from "../dtos/slots.dtos";

@Injectable()
export class SlotsService {
  async getAllEventSlots(): Promise<EventSlots[]> {
    const documents = await Slot.find().lean();

    const eventSlots = await Promise.all(documents.map((document) => this.getEventSlots(document.eventId)));

    return eventSlots;
  }

  async getEventSlots(eventId: number): Promise<EventSlots> {
    const document = await Slot.findOne({ eventId }).lean();

    if (!document) throw new NotFoundException(`Couldn't find slots for eventId ${eventId}`);

    const eventName = (await getTMPEvent(eventId)).name;

    const locations = document.chunks.flatMap((chunk) => {
      return chunk.locations.map((location) => {
        return {
          name: location.name,
          slots: location.slots,
          imageUrl: location.imageUrl,
        };
      });
    });

    return {
      eventId: document.eventId,
      eventName,
      locations,
    };
  }

  async getEventSlot(eventId: number, slot: string): Promise<EventSlots["locations"][number]["slots"][number]> {
    const document = await Slot.findOne({ eventId });

    if (!document) throw new NotFoundException(`Couldn't find slots for eventId ${eventId}`);

    const chunk = document.chunks.find((chunk) => chunk.locations.some((location) => location.slots.has(slot)));
    if (!chunk) throw new NotFoundException(`Couldn't find slot ${slot} for eventId ${eventId}`);

    const location = chunk.locations.find((location) => location.slots.has(slot));
    if (!location) throw new NotFoundException(`Couldn't find slot ${slot} for eventId ${eventId}`);

    const slotObj = location.slots.get(slot);
    if (!slotObj) throw new NotFoundException(`Couldn't find slot ${slot} for eventId ${eventId}`);

    return slotObj;
  }

  async getAvailableEventSlots(eventId: number): Promise<string[]> {
    const document = await Slot.findOne({ eventId }).lean();

    if (!document) throw new NotFoundException(`Couldn't find slots for eventId ${eventId}`);

    const slots = document.chunks.flatMap((chunk) => {
      return chunk.locations.flatMap((location) => {
        return Object.entries(location.slots)
          .filter(([, slot]) => !slot.taken)
          .map(([slot]) => slot);
      });
    });

    return slots;
  }

  async updateEventSlot(data: PatchSlotsDto) {
    const document = await Slot.findOne({ eventId: data.eventId });
    if (!document) throw new NotFoundException(`Couldn't find slots for eventId ${data.eventId}`);

    const chunk = document.chunks.find((chunk) => chunk.locations.some((location) => location.slots.has(data.slot)));
    if (!chunk) throw new NotFoundException(`Couldn't find slot ${data.slot} for eventId ${data.eventId}`);

    const location = chunk.locations.find((location) => location.slots.has(data.slot));
    if (!location) throw new NotFoundException(`Couldn't find slot ${data.slot} for eventId ${data.eventId}`);

    const slot = location.slots.get(data.slot);
    if (!slot) throw new NotFoundException(`Couldn't find slot ${data.slot} for eventId ${data.eventId}`);

    let vtc: APICompany;
    try {
      vtc = await getTMPVTC(data.vtcId);
    } catch (err) {
      throw new BadRequestException(`Couldn't fetch VTC with id ${data.vtcId}`);
    }

    slot.vtcId = data.vtcId;
    slot.displayName = vtc.name;
    slot.taken = true;

    await document.save();
    await updateSlots(client, data.eventId);

    return {
      eventId: document.eventId,
      slot: data.slot,
      vtcId: data.vtcId,
      displayName: vtc.name,
    };
  }
}

export type EventSlots = {
  eventId: number;
  eventName: string;
  locations: {
    name: string;
    slots: Record<string, { vtcId: number; displayName: string; taken: boolean }>;
    imageUrl: string;
  }[];
};
