import { Module } from "@nestjs/common";
import { SlotsService } from "../services/slots.service";
import { SlotsController } from "../controllers/slots.controller";

@Module({
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
