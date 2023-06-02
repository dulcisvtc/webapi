import { CacheTTL, Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import type { APICompanyMembers, APICompanyNews, APIGameEvent } from "@truckersmp_official/api-types/v2";
import ms from "ms";
import { TMPService } from "./tmp.service";

@Controller("tmp")
export class TMPController {
    constructor(private readonly tmpService: TMPService) { };

    @Get("news")
    async findNews(): Promise<{ response: APICompanyNews }> {
        return await this.tmpService.getNews();
    };

    @Get("members")
    async findMembers(): Promise<{ response: APICompanyMembers }> {
        return await this.tmpService.getMembers();
    };

    @Get("event/:id")
    @CacheTTL(ms("1h"))
    async findEvent(
        @Param("id", new ParseIntPipe())
        id: number
    ): Promise<{ response: APIGameEvent }> {
        return await this.tmpService.getEvent(id);
    };
};