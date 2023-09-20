import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TMPService } from "../tmp/tmp.service";
import { EventsController } from "./events.controller";
import { EventsGateway } from "./events.gateway";
import { EventsService } from "./events.service";

@Module({
    imports: [AuthModule],
    controllers: [EventsController],
    providers: [
        AuthModule,
        EventsService,
        EventsGateway,
        TMPService
    ]
})
export class EventsModule { };