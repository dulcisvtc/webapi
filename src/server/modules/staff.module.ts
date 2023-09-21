import { Module } from "@nestjs/common";
import { StaffService } from "../services/staff.service";
import { StaffController } from "../controllers/staff.controller";

@Module({
    controllers: [StaffController],
    providers: [StaffService],
})
export class StaffModule { };