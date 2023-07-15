import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { RequirePermissions } from "../auth/auth.decorator";
import { DeleteEventDto, PostEventDto } from "./events.dtos";
import { EventsService } from "./events.service";

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