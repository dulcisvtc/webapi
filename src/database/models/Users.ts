import { model, Schema } from "mongoose";
import type { UserSchema } from "../../../types";

const UserObject: UserSchema = {
    steam_id: "",
    discord_id: "",
    leaderboard: {
        monthly_mileage: 0
    }
};

const UserSchema = new Schema<UserSchema>(UserObject);
export const Users = model<UserSchema>("Users", UserSchema);