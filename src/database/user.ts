import type { UserDocument } from "./models/User";
import { User } from "./models/User";

export function getUserDocumentBySteamId(steamId: string): Promise<UserDocument> {
    return new Promise<UserDocument>((resolve) => {
        void User.findOne({ steam_id: steamId }).then((userInDb) => {
            const user = userInDb ?? new User({ steam_id: steamId });

            return resolve(user);
        });
    });
};

// don't create a new document here
export function getUserDocumentByDiscordId(discordId: string): Promise<UserDocument | null> {
    return new Promise<UserDocument | null>((resolve) => {
        void User.findOne({ discord_id: discordId }).then((userInDb) => {
            return resolve(userInDb);
        });
    });
};

export async function resetUserDocument(steamId: string): Promise<void> {
    const user = await getUserDocumentBySteamId(steamId);
    return void user.remove();
};