import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Get, Header, Inject, Param, StreamableFile, ValidationPipe } from "@nestjs/common";
import type { Cache } from "cache-manager";
import ms from "ms";
import type { GetUserBannerParams } from "../dtos/users.dtos";
import { UsersService } from "../services/users.service";

@Controller("users")
export class UsersController {
    constructor(
        private usersService: UsersService,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache
    ) { };

    @Get()
    async findUsers() {
        return await this.usersService.getUsers();
    };

    @Get(":query/banner.png")
    @Header("Content-Type", "image/png")
    async findUserBanner(
        @Param() { query }: GetUserBannerParams
    ) {
        const cached = await this.cacheManager.get<string>(`${query}-banner`);
        if (cached) return new StreamableFile(Buffer.from(cached, "base64"));

        const banner = await this.usersService.getUserBanner(query);
        await this.cacheManager.set(`${query}-banner`, banner.toString("base64"), ms("1h"));

        return new StreamableFile(banner);
    };

    @Get(":discordId")
    async findUser(
        @Param("discordId", new ValidationPipe({ expectedType: String }))
        discordId: string
    ) {
        return await this.usersService.getUser(discordId);
    };
};