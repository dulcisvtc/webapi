import type { UserDocument } from "./models/User";
import { User } from "./models/User";

export function getUserDocument(steamId: string): Promise<UserDocument> {
    return new Promise<UserDocument>((resolve) => {
        void User.findOne({ steam_id: steamId }).then((userInDb) => {
            const user = userInDb ?? new User({ steam_id: steamId });

            return resolve(user);
        });
    });
};

export async function resetUserDocument(userid: string): Promise<void> {
    const user = await getUserDocument(userid);
    return void user.remove();
};