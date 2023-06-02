import { Injectable, NotFoundException } from "@nestjs/common";
import { User, UserDocument } from "../../database";

@Injectable()
export class UsersService {
    async getUsers(): Promise<UserDocument[]> {
        const users = await User.find({}, "-_id -__v");

        return users;
    };

    async getUser(discordId: string): Promise<UserDocument> {
        const user = await User.findOne({ discord_id: discordId }, "-_id -__v");

        if (!user) throw new NotFoundException("User not found");

        return user;
    };
};