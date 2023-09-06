import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { GetSlotsEventIdDto, PatchSlotsDto } from "./slots.dtos";
import { EventSlots, SlotsService } from "./slots.service";
import { RequirePermissions } from "../auth/auth.decorator";

@Controller("slots")
export class SlotsController {
    constructor(private slotsService: SlotsService) { };

    @Get()
    async findAllEventSlots(): Promise<EventSlots[]> {
        return await this.slotsService.getAllEventSlots();
    };

    @Get(":eventId")
    async findEventSlots(@Param() params: GetSlotsEventIdDto): Promise<EventSlots> {
        return await this.slotsService.getEventSlots(params.eventId);
    };

    @Patch()
    @RequirePermissions("ManageSlots")
    async updateEventSlot(
        @Body() data: PatchSlotsDto
    ): Promise<{ message: string }> {
        const res = await this.slotsService.updateEventSlot(data);

        return {
            message: `Updated slot ${res.slot} for eventId ${res.eventId} with vtcId ${res.vtcId} (${res.displayName})`
        };
    };
};