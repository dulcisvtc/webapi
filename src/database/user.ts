import type { UserDocument } from "./models/User";
import type { Snowflake } from "discord.js";
import { User } from "./models/User";

export function getUserDocument(userId: Snowflake): Promise<UserDocument> {
    return new Promise<UserDocument>((resolve) => {
        void User.findOne({ userId }).then((userInDb) => {
            const user = userInDb ?? new User({ userId });

            return resolve(user);
        });
    });
};

export async function resetUserDocument(userid: Snowflake): Promise<void> {
    const user = await getUserDocument(userid);
    return void user.remove();
};