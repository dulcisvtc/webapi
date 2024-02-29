import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";
import { Controller, Get, Query, UseInterceptors } from "@nestjs/common";
import ms from "ms";
import { MonthlyLeaderboardQueryParams } from "../dtos/leaderboard.dtos";
import { LeaderboardService } from "../services/leaderboard.service";
import type { LeaderboardUser } from "../types/leaderboard";

@Controller("leaderboard")
@UseInterceptors(CacheInterceptor)
@CacheTTL(ms("1m"))
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get("monthly")
  async getMonthly(@Query() params: MonthlyLeaderboardQueryParams): Promise<LeaderboardUser[]> {
    const [paramYear, paramMonth] = params.month?.split("-") ?? [undefined, undefined];

    const year = paramYear ? parseInt(paramYear, 10) : new Date().getUTCFullYear();
    const month = paramMonth ? parseInt(paramMonth, 10) - 1 : new Date().getUTCMonth();

    const leaderboard = await this.leaderboardService.getMonthly(year, month);

    return leaderboard;
  }

  @Get("alltime")
  async getAllTime(): Promise<LeaderboardUser[]> {
    const leaderboard = await this.leaderboardService.getAllTime();

    return leaderboard;
  }
}
