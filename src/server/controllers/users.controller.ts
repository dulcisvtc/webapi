import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Get, Header, Inject, Param, StreamableFile, ValidationPipe } from "@nestjs/common";
import type { Cache } from "cache-manager";
import ms from "ms";
import { GetUserBannerParams } from "../dtos/users.dtos";
import { UsersService } from "../services/users.service";

@Controller("users")
export class UsersController {
  constructor(
    private usersService: UsersService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  @Get()
  async findUsers() {
    return await this.usersService.getUsers();
  }

  @Get(":query/banner.png")
  @Header("Content-Type", "image/png")
  async findUserBanner(@Param() { query }: GetUserBannerParams) {
    const { steam_id: steamId } = await this.usersService.getUser(query);

    const cached = await this.cacheManager.get<string>(`${steamId}-banner`);
    if (cached) return new StreamableFile(Buffer.from(cached, "base64"));

    const banner = await this.usersService.getUserBanner(steamId);
    await this.cacheManager.set(`${steamId}-banner`, banner.toString("base64"), ms("7d"));

    return new StreamableFile(banner);
  }

  @Get(":discordOrSteamId")
  async findUser(
    @Param("discordOrSteamId", new ValidationPipe({ expectedType: String }))
    discordOrSteamId: string
  ) {
    return await this.usersService.getUser(discordOrSteamId);
  }
}
