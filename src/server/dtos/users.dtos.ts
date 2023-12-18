import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetUserBannerParams {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query!: string;
}
