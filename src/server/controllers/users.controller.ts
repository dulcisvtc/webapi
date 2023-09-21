import { Controller, Get, Param, ValidationPipe } from "@nestjs/common";
import { UsersService } from "../services/users.service";

@Controller("users")
export class UsersController {
    constructor(private usersService: UsersService) { };

    @Get()
    async findUsers() {
        return await this.usersService.getUsers();
    };

    @Get(":discordId")
    async findUser(
        @Param("discordId", new ValidationPipe({ expectedType: String }))
        discordId: string
    ) {
        return await this.usersService.getUser(discordId);
    };
};