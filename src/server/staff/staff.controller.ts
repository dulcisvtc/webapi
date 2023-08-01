import { Controller, Get } from "@nestjs/common";
import { Staff, StaffService } from "./staff.service";

@Controller("staff")
export class StaffController {
    constructor(private staffService: StaffService) { };

    @Get()
    async findStaff(): Promise<Staff[]> {
        return await this.staffService.getStaff();
    };
};