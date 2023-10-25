import { Module } from "@nestjs/common";
import { LeaderboardController } from "../controllers/leaderboard.controller";
import { LeaderboardService } from "../services/leaderboard.service";

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
