import { Module } from "@nestjs/common";
import { TMPController } from "../controllers/tmp.controller";
import { TMPService } from "../services/tmp.service";

@Module({
    controllers: [TMPController],
    providers: [TMPService],
})
export class TMPModule { };