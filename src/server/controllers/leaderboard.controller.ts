import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";
import { Controller, Get, UseInterceptors } from "@nestjs/common";
import ms from "ms";
import { LeaderboardService } from "../services/leaderboard.service";
import type { LeaderboardUser } from "../types/leaderboard";

@Controller("leaderboard")
@UseInterceptors(CacheInterceptor)
@CacheTTL(ms("1m"))
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get("monthly")
  async getMonthly(): Promise<LeaderboardUser[]> {
    const leaderboard = await this.leaderboardService.getMonthly();

    return leaderboard;
  }

  @Get("alltime")
  async getAllTime(): Promise<LeaderboardUser[]> {
    const leaderboard = await this.leaderboardService.getAllTime();

    return leaderboard;
  }
}
