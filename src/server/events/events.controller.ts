import { Body, Controller, Delete, Get, Post, Req, UsePipes, ValidationPipe } from "@nestjs/common";
import type { Request } from "express";
import { DeleteEventDto, PostEventDto } from "./events.dtos";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
    constructor(private readonly eventsService: EventsService) { };

    @Get()
    public getEvents() {
        return this.eventsService.getEvents();
    };

    @Post()
    @UsePipes(new ValidationPipe())
    public postEvent(
        @Req() req: Request,
        @Body() postEventDto: PostEventDto
    ) {
        const secret = req.headers["secret"] as string;

        return this.eventsService.postEvent(postEventDto, secret);
    };

    @Delete()
    @UsePipes(new ValidationPipe())
    public deleteEvent(
        @Req() req: Request,
        @Body() data: DeleteEventDto
    ) {
        const secret = req.headers["secret"] as string;

        return this.eventsService.deleteEvent(data.eventId, secret);
    };
};