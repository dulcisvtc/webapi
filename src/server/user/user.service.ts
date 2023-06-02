import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import config from "../../config";
import { getUserDocumentBySteamId } from "../../database";

@Injectable()
export class UserService {
    async updateUsername(steamId: string, username: string, secret: string): Promise<boolean> {
        if (secret !== config.messaging_secret) throw new ForbiddenException("Invalid secret");

        const document = await getUserDocumentBySteamId(steamId, true);

        if (!document) throw new NotFoundException("User not found");

        document.username = username;
        await document.save();

        return true;
    };
};