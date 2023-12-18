import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsNumberString } from "class-validator";

export class GetSlotsEventIdDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  eventId!: number;
}

export class GetSlotsEventIdSlotDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  eventId!: number;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  slot!: string;
}

export class GetSlotsEventIdAvailableDto {
  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  eventId!: number;
}

export class PatchSlotsDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  eventId!: number;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  slot!: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  vtcId!: number;
}
