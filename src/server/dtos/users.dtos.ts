import { IsNotEmpty, IsString } from "class-validator";

export class GetUserBannerParams {
    @IsString()
    @IsNotEmpty()
    query!: string;
};