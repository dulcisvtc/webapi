import { Module } from "@nestjs/common";
import { AuthModule } from "./auth.module";
import { TMPService } from "../services/tmp.service";
import { EventsController } from "../controllers/events.controller";
import { EventsGateway } from "../gateways/events.gateway";
import { EventsService } from "../services/events.service";

@Module({
  imports: [AuthModule],
  controllers: [EventsController],
  providers: [AuthModule, EventsService, EventsGateway, TMPService],
})
export class EventsModule {}
