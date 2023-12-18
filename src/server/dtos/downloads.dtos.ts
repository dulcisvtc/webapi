import { IsIn, IsNotEmpty, IsNumberString, IsString } from "class-validator";
import type { Tag } from "../types/downloads";
import { ApiProperty } from "@nestjs/swagger";

const Tags: Tag[] = ["localmod", "saveedit", "interface"];

export class PostPatchDownloadsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  downloadUrl!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @ApiProperty({ enum: Tags, isArray: true })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(Tags, { each: true })
  tags!: Tag[];
}

export class PatchDeleteDownloadsUriDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  id!: number;
}
