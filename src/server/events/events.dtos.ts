import { IsNumber, IsString, ValidateIf } from "class-validator";

export class PostEventDto {
    @IsNumber()
    eventId!: number;

    @IsString()
    location!: string;

    @IsString()
    destination!: string;

    @IsNumber()
    meetup!: number;

    @IsNumber()
    departure!: number;

    @IsNumber()
    @ValidateIf((_, v) => v !== null)
    slotId!: number | null;

    @IsString()
    @ValidateIf((_, v) => v !== null)
    slotImage!: string | null;
};

export class DeleteEventDto {
    @IsNumber()
    eventId!: number;
};