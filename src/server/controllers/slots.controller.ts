import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { RequirePermissions } from "../decorators/auth.decorator";
import { GetSlotsEventIdAvailableDto, GetSlotsEventIdDto, GetSlotsEventIdSlotDto, PatchSlotsDto } from "../dtos/slots.dtos";
import { EventSlots, SlotsService } from "../services/slots.service";

@Controller("slots")
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  @Get()
  async findAllEventSlots(): Promise<EventSlots[]> {
    return await this.slotsService.getAllEventSlots();
  }

  @Get(":eventId")
  async findEventSlots(@Param() params: GetSlotsEventIdDto): Promise<EventSlots> {
    return await this.slotsService.getEventSlots(params.eventId);
  }

  @Get(":eventId/available")
  async findAvailableEventSlots(@Param() params: GetSlotsEventIdAvailableDto): Promise<string[]> {
    return await this.slotsService.getAvailableEventSlots(params.eventId);
  }

  @Get(":eventId/:slot")
  async findEventSlot(@Param() params: GetSlotsEventIdSlotDto): Promise<EventSlots["locations"][number]["slots"][number]> {
    return await this.slotsService.getEventSlot(params.eventId, params.slot);
  }

  @Patch()
  @RequirePermissions("ManageSlots")
  async updateEventSlot(@Body() data: PatchSlotsDto): Promise<{ message: string }> {
    const res = await this.slotsService.updateEventSlot(data);

    return {
      message: `Updated slot ${res.slot} for eventId ${res.eventId} with vtcId ${res.vtcId} (${res.displayName})`,
    };
  }
}
