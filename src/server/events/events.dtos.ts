import { IsNumber, IsString, MaxLength, ValidateIf } from "class-validator";

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

    @IsString()
    @ValidateIf((_, v) => v !== null)
    slotId!: string | null;

    @IsString()
    @ValidateIf((_, v) => v !== null)
    slotImage!: string | null;

    @IsString()
    @ValidateIf((_, v) => v !== null)
    @MaxLength(1000)
    notes!: string | null;
};

export class DeleteEventDto {
    @IsNumber()
    eventId!: number;
};