import { Controller, Get, Param, ValidationPipe } from "@nestjs/common";
import type { UserDocument } from "../../database";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) { };

    @Get()
    async findUsers(): Promise<UserDocument[]> {
        return await this.usersService.getUsers();
    };

    @Get(":discordId")
    async findUser(
        @Param("discordId", new ValidationPipe({ expectedType: String }))
        discordId: string
    ): Promise<UserDocument> {
        return await this.usersService.getUser(discordId);
    };
};