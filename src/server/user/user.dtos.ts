import { IsNotEmpty } from "class-validator";

export class UpdateUsernameDto {
    @IsNotEmpty()
    steam_id!: string;

    @IsNotEmpty()
    username!: string;
};