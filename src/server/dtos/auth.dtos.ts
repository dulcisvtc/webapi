import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class PostAuthLoginDto {
  @ApiProperty({ enum: ["discord", "steam"] })
  @IsIn(["discord", "steam"])
  provider!: "discord" | "steam";

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: "Only required for Discord" })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: PostAuthLoginDto) => o.provider === "discord")
  scope!: string;
}

export class PostAuthLogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  access_token!: string;
}
