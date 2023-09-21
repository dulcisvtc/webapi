import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "../../database";

@Injectable()
export class UsersService {
    async getUsers() {
        const users = await User.find({}, "-_id -__v").lean();

        return users;
    };

    async getUser(discordId: string) {
        const user = await User.findOne({ discord_id: discordId }, "-_id -__v").lean();

        if (!user) throw new NotFoundException("User not found");

        return user;
    };
};