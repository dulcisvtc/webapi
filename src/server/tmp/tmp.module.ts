import { Module } from "@nestjs/common";
import { TMPController } from "./tmp.controller";
import { TMPService } from "./tmp.service";

@Module({
    controllers: [TMPController],
    providers: [TMPService],
})
export class TMPModule { };