import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import type { APICompanyMembers, APIGameEvent } from "@truckersmp_official/api-types/v2";
import { TMPService } from "./tmp.service";

@Controller("tmp")
export class TMPController {
    constructor(private tmpService: TMPService) { };

    @Get("members")
    async findMembers(): Promise<{ response: APICompanyMembers }> {
        return await this.tmpService.getMembers();
    };

    @Get("event/:id")
    async findEvent(
        @Param("id", new ParseIntPipe())
        id: number
    ): Promise<{ response: APIGameEvent }> {
        return await this.tmpService.getEvent(id);
    };
};