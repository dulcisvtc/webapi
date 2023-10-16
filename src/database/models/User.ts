import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class LeaderboardSchema {
    @prop({ type: Number, default: 0 }) monthly_mileage!: number;
    @prop({ type: Number, default: 0 }) alltime_mileage!: number;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class WarnSchema {
    @prop({ type: String, required: true }) id!: string;
    @prop({ type: String, required: true }) userId!: string;
    @prop({ type: String, required: true }) createdById!: string;
    @prop({ type: String, default: "None" }) description!: string;
    @prop({ type: Number, required: true }) createdTimestamp!: number;
};

@modelOptions({ schemaOptions: { collection: "users" }, options: { allowMixed: Severity.ALLOW } })
export class UserSchema {
    @prop({ type: String, unique: true, required: true }) steam_id!: string;
    @prop({ type: String, unique: true, required: true }) discord_id!: string;
    @prop({ type: String, required: true }) username!: string;
    @prop({ type: Number, default: 0 }) permissions!: number;
    @prop({ type: LeaderboardSchema, default: {} }) leaderboard!: LeaderboardSchema;
    @prop({ type: WarnSchema, default: {} }, PropType.MAP) warns!: Map<string, WarnSchema>;
    @prop({ type: Boolean, default: false }) banNotified!: boolean;
};

export type UserDocument = DocumentType<UserSchema>;

export const User = getModelForClass(UserSchema);