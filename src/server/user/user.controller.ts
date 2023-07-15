import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { UpdateUsernameDto } from "./user.dtos";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
    constructor(private userService: UserService) { };

    @Post("username")
    async updateUsername(
        @Req() req: Request,
        @Body() updateUsernameDto: UpdateUsernameDto
    ): Promise<{ message: string }> {
        const secret = req.headers["secret"] as string;
        const { steam_id, username } = updateUsernameDto;

        await this.userService.updateUsername(steam_id, username, secret);

        return { message: "OK" };
    };
};