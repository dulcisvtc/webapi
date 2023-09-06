import { IsNotEmpty, IsNumber, IsNumberString } from "class-validator";

export class GetSlotsEventIdDto {
    @IsNumberString()
    @IsNotEmpty()
    eventId!: number;
};

export class PatchSlotsDto {
    @IsNumber()
    @IsNotEmpty()
    eventId!: number;

    @IsNumberString()
    @IsNotEmpty()
    slot!: string;

    @IsNumber()
    @IsNotEmpty()
    vtcId!: number;
};