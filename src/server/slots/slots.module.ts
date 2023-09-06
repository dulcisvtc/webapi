import { Module } from "@nestjs/common";
import { SlotsService } from "./slots.service";
import { SlotsController } from "./slots.controller";

@Module({
    controllers: [SlotsController],
    providers: [SlotsService],
})
export class SlotsModule { };