import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "sessions" }, options: { allowMixed: Severity.ALLOW } })
class SessionSchema {
    @prop({ type: String, unique: true, required: true }) access_token!: string;
    @prop({ type: String, required: true }) steamId!: string;
    @prop({ type: String, required: true }) avatarUrl!: string;
    @prop({ type: Number, required: true }) expiresAt!: number;
    @prop({ type: Number, default: Date.now() }) createdAt!: number;
};

export type SessionDocument = DocumentType<SessionSchema>;

export const Session = getModelForClass(SessionSchema);