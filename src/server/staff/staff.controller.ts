import { CacheTTL, Controller, Get } from "@nestjs/common";
import ms from "ms";
import { Staff, StaffService } from "./staff.service";

@Controller("staff")
export class StaffController {
    constructor(private readonly staffService: StaffService) { };

    @Get()
    @CacheTTL(ms("10m"))
    async findStaff(): Promise<Staff[]> {
        return await this.staffService.getStaff();
    };
};