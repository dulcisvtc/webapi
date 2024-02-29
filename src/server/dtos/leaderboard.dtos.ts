import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class MonthlyLeaderboardQueryParams {
  @ApiProperty({ required: false, description: "The month to get the leaderboard for in the format YYYY-MM" })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/) // YYYY-MM
  month?: string;
}
