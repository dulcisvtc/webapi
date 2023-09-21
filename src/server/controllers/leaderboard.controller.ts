import { Controller, Get } from "@nestjs/common";
import { LeaderboardService } from "../services/leaderboard.service";
import type { LeaderboardUser } from "../types/leaderboard";
import { CacheTTL } from "@nestjs/cache-manager";
import ms from "ms";

@Controller("leaderboard")
export class LeaderboardController {
    constructor(private leaderboardService: LeaderboardService) { }

    @Get("monthly")
    @CacheTTL(ms("1m"))
    async getMonthly(): Promise<LeaderboardUser[]> {
        const leaderboard = await this.leaderboardService.getMonthly();

        return leaderboard;
    };

    @Get("alltime")
    @CacheTTL(ms("1m"))
    async getAllTime(): Promise<LeaderboardUser[]> {
        const leaderboard = await this.leaderboardService.getAllTime();

        return leaderboard;
    };
};