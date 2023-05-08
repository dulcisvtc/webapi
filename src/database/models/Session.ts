import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "sessions" }, options: { allowMixed: Severity.ALLOW } })
class SessionSchema {
    @prop({ type: String, unique: true, required: true }) uuid!: string;
    @prop({ type: Number, default: Date.now() }) createdAt!: number;
    @prop({ type: Number, required: true }) expires!: number;
    @prop({ type: String, required: true }) steam_id!: string;
};

export type SessionDocument = DocumentType<SessionSchema>;

export const Session = getModelForClass(SessionSchema);