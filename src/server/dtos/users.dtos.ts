import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetUserBannerParams {
  @ApiProperty({ description: "SteamID64 or Discord ID" })
  @IsString()
  @IsNotEmpty()
  query!: string;
}
