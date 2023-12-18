import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, MaxLength, ValidateIf } from "class-validator";

export class PostEventDto {
  @ApiProperty()
  @IsNumber()
  eventId!: number;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiProperty()
  @IsString()
  destination!: string;

  @ApiProperty()
  @IsNumber()
  meetup!: number;

  @ApiProperty()
  @IsNumber()
  departure!: number;

  @ApiProperty({ nullable: true })
  @IsString()
  @ValidateIf((_, v) => v !== null)
  slotId!: string | null;

  @ApiProperty({ nullable: true })
  @IsString()
  @ValidateIf((_, v) => v !== null)
  slotImage!: string | null;

  @ApiProperty({ nullable: true })
  @IsString()
  @ValidateIf((_, v) => v !== null)
  @MaxLength(1000)
  notes!: string | null;
}

export class DeleteEventDto {
  @ApiProperty()
  @IsNumber()
  eventId!: number;
}
