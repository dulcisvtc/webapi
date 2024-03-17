import { Controller, Get, Param, Res, StreamableFile, ValidationPipe } from "@nestjs/common";
import { Response } from "express";
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
  async findUserBanner(@Param() { query }: GetUserBannerParams, @Res({ passthrough: true }) res: Response) {
    const { buffer /* cache */ } = await this.usersService.getUserCachedBanner(query);

    res.setHeader("Content-Type", "image/png");
    // if (cache) res.status(304);

    return new StreamableFile(buffer, { type: "image/png" });
  }

  @Get(":discordOrSteamId")
  async findUser(
    @Param("discordOrSteamId", new ValidationPipe({ expectedType: String }))
    discordOrSteamId: string
  ) {
    return await this.usersService.getUser(discordOrSteamId);
  }
}
