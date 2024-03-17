import { Controller, Get, Header, Param, StreamableFile, ValidationPipe } from "@nestjs/common";
import { GetUserBannerParams } from "../dtos/users.dtos";
import { UsersService } from "../services/users.service";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findUsers() {
    return await this.usersService.getUsers();
  }

  @Get(":query/banner.png")
  @Header("Content-Type", "image/png")
  async findUserBanner(@Param() { query }: GetUserBannerParams) {
    const banner = await this.usersService.getUserCachedBanner(query);

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
