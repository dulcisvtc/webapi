import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Slot } from "../../database";
import type { PatchSlotsDto } from "./slots.dtos";
import type { APICompany } from "@truckersmp_official/api-types/v2";
import { getTMPVTC } from "../../constants/functions";
import updateSlots from "../../lib/updateSlots";
import { client } from "../..";

@Injectable()
export class SlotsService {
    async getAllEventSlots(): Promise<EventSlots[]> {
        const documents = await Slot.find().lean();

        const eventSlots = documents.map((document) => {
            const locations = document.chunks.flatMap((chunk) => {
                return chunk.locations.map((location) => {
                    return {
                        name: location.name,
                        slots: location.slots
                    };
                });
            });

            return {
                eventId: document.eventId,
                locations
            };
        });

        return eventSlots;
    };

    async getEventSlots(eventId: number): Promise<EventSlots> {
        const document = await Slot.findOne({ eventId }).lean();

        if (!document) throw new NotFoundException(`Couldn't find slots for eventId ${eventId}`);

        const locations = document.chunks.flatMap((chunk) => {
            return chunk.locations.map((location) => {
                return {
                    name: location.name,
                    slots: location.slots
                };
            });
        });

        return {
            eventId: document.eventId,
            locations
        };
    };

    async getAvailableEventSlots(eventId: number): Promise<string[]> {
        const document = await Slot.findOne({ eventId }).lean();

        if (!document) throw new NotFoundException(`Couldn't find slots for eventId ${eventId}`);

        const slots = document.chunks.flatMap((chunk) => {
            return chunk.locations.flatMap((location) => {
                return Object.entries(location.slots).filter(([, slot]) => !slot.taken).map(([slot]) => slot);
            });
        });

        return slots;
    };

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
        };

        slot.vtcId = data.vtcId;
        slot.displayName = vtc.name;
        slot.taken = true;

        await document.save();
        await updateSlots(client, data.eventId);

        return {
            eventId: document.eventId,
            slot: data.slot,
            vtcId: data.vtcId,
            displayName: vtc.name
        };
    };
};

export type EventSlots = {
    eventId: number;
    locations: {
        name: string;
        slots: Record<string, { vtcId: number; displayName: string; taken: boolean; }>
    }[];
};