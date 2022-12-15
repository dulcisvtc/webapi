import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";
import { Snowflake } from "discord.js";

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class LeaderboardSchema {
    @prop({ type: Number, default: 0 }) monthly_mileage!: number;
    @prop({ type: Number, default: 0 }) alltime_mileage!: number;
};

const saveQueue = new Map<Snowflake, 1 | 2>();

@modelOptions({ schemaOptions: { collection: "users" }, options: { allowMixed: Severity.ALLOW } })
class UserSchema {
    @prop({ type: String, unique: true, required: true }) steam_id!: string;
    @prop({ type: String, unique: true }) discord_id?: string;
    @prop({ type: String }) username?: string;
    @prop({ type: Number, default: 0 }) permission!: number;
    @prop({ type: LeaderboardSchema, default: {} }) leaderboard!: LeaderboardSchema;

    safeSave(this: UserDocument): void {
        if (saveQueue.has(this.steam_id)) return void saveQueue.set(this.steam_id, 2);

        saveQueue.set(this.steam_id, 1);
        return void this.save().then(() => {
            if (saveQueue.get(this.steam_id) === 2) {
                saveQueue.delete(this.steam_id);
                this.safeSave();
            } else saveQueue.delete(this.steam_id);
        });
    };
};

export type UserDocument = DocumentType<UserSchema>;

export const User = getModelForClass(UserSchema);