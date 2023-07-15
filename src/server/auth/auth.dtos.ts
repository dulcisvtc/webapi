import { IsIn, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class PostAuthLoginDto {
    @IsIn(["discord", "steam"])
    provider!: "discord" | "steam";

    @IsString()
    @IsNotEmpty()
    code!: string;

    @IsString()
    @IsNotEmpty()
    @ValidateIf((o: PostAuthLoginDto) => o.provider === "discord")
    scope!: string;
};

export class PostAuthLogoutDto {
    @IsString()
    @IsNotEmpty()
    access_token!: string;
};