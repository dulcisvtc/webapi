import { IsIn, IsNotEmpty, IsNumberString, IsString } from "class-validator";
import type { Tag } from "../types/downloads";

const Tags: Tag[] = ["localmod", "saveedit", "interface"];

export class PostPatchDownloadsDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsString()
    @IsNotEmpty()
    downloadUrl!: string;

    @IsString()
    @IsNotEmpty()
    imageUrl!: string;

    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @IsIn(Tags, { each: true })
    tags!: Tag[];
};

export class PatchDeleteDownloadsUriDto {
    @IsNumberString()
    @IsNotEmpty()
    id!: number;
};