import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { RequirePermissions } from "../decorators/auth.decorator";
import { DeleteEventDto, PostEventDto } from "../dtos/events.dtos";
import { EventsService } from "../services/events.service";

@Controller("events")
export class EventsController {
    constructor(private eventsService: EventsService) { };

    @Get()
    public getEvents() {
        return this.eventsService.getEvents();
    };

    @Post()
    @RequirePermissions("ManageEvents")
    public postEvent(
        @Body() postEventDto: PostEventDto
    ) {
        return this.eventsService.postEvent(postEventDto);
    };

    @Delete()
    @RequirePermissions("ManageEvents")
    public deleteEvent(
        @Body() data: DeleteEventDto
    ) {
        return this.eventsService.deleteEvent(data.eventId);
    };
};