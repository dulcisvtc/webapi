import { ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class UserService {
    async updateUsername(steamId: string, username: string, secret: string): Promise<boolean> {
        steamId; username; secret;
        throw new ForbiddenException("Invalid secret");

        // const document = await getUserDocumentBySteamId(steamId, true);
        // if (!document) throw new NotFoundException("User not found");

        // document.username = username;
        // await document.save();

        // return true;
    };
};