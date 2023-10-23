import { AutoIncrementID } from "@typegoose/auto-increment";
import { DocumentType, getModelForClass, modelOptions, plugin, prop, Ref, Severity } from "@typegoose/typegoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { UserSchema } from "./User";

@plugin(mongooseAutoPopulate)
@plugin(AutoIncrementID, {})
@modelOptions({ schemaOptions: { collection: "warns" }, options: { allowMixed: Severity.ALLOW } })
class WarnSchema {
    @prop() _id!: number;

    @prop({ autopopulate: true, ref: () => UserSchema }) user!: Ref<UserSchema>;

    @prop({ type: String, default: "None" }) description!: string;

    @prop({ type: Number, default: Date.now }) createdAt!: number;
    @prop({ autopopulate: true, ref: () => UserSchema }) createdBy!: Ref<UserSchema>;
};

export type WarnDocument = DocumentType<WarnSchema>;

export const Warn = getModelForClass(WarnSchema);