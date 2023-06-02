import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller";
import { EventsGateway } from "./events.gateway";
import { EventsService } from "./events.service";

@Module({
    controllers: [EventsController],
    providers: [
        EventsService,
        EventsGateway
    ]
})
export class EventsModule { };