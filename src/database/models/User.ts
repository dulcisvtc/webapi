import { DocumentType, getModelForClass, index, modelOptions, prop, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class LeaderboardSchema {
  @prop({ type: Number, default: 0 }) monthly_mileage!: number;
  @prop({ type: Number, default: 0 }) alltime_mileage!: number;
}

@modelOptions({ schemaOptions: { collection: "users" }, options: { allowMixed: Severity.ALLOW } })
@index({ steam_id: 1 }, { unique: true })
@index({ discord_id: 1 }, { unique: true })
@index({ username: 1 }, { unique: true })
@index({ steam_id: "text", discord_id: "text", username: "text" })
@index({ "leaderboard.monthly_mileage": -1 })
@index({ "leaderboard.alltime_mileage": -1 })
export class UserSchema {
  @prop({ type: String, unique: true, required: true }) steam_id!: string;
  @prop({ type: String, unique: true, required: true }) discord_id!: string;
  @prop({ type: String, unique: true, required: true }) username!: string;
  @prop({ type: Number, default: 0 }) permissions!: number;
  @prop({ type: Number, default: 0 }) experience!: number;
  @prop({ type: LeaderboardSchema, default: {} }) leaderboard!: LeaderboardSchema;
  @prop({ type: Boolean, default: false }) banNotified!: boolean;
  @prop({ type: String }) avatar?: string | null | undefined;
}

export type UserDocument = DocumentType<UserSchema>;

export const User = getModelForClass(UserSchema);
