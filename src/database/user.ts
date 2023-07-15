import { inspect } from "util";
import { User, type UserDocument } from ".";
import { getLogger } from "../logger";

const dbLogger = getLogger("database", true);

export function getUserDocumentBySteamId(steamId: string, returnNull: true): Promise<UserDocument | null>;
export function getUserDocumentBySteamId(steamId: string, returnNull?: boolean): Promise<UserDocument>;
export function getUserDocumentBySteamId(steamId: string, returnNull?: boolean): Promise<UserDocument | null> {
    return new Promise((resolve) => {
        void User.findOne({ steam_id: steamId }).then((userInDb) => {
            if (userInDb || returnNull) return resolve(userInDb);

            const user = new User({ steam_id: steamId });

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
    dbLogger.debug(`Reset user document for ${steamId}:\n${inspect(user, { depth: Infinity })}`);
    return void user.deleteOne();
};