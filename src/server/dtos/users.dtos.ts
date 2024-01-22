import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class GetUserBannerParams {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  query!: string;
}
