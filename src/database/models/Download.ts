import { AutoIncrementID } from "@typegoose/auto-increment";
import { DocumentType, getModelForClass, modelOptions, plugin, pre, prop, Ref, Severity } from "@typegoose/typegoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import type { Tag } from "../../server/types/downloads";
import { UserSchema } from "./User";

@plugin(mongooseAutoPopulate)
@plugin(AutoIncrementID, {})
@modelOptions({ schemaOptions: { collection: "downloads" }, options: { allowMixed: Severity.ALLOW } })
@pre<DownloadSchema>("save", function () {
  this.updatedAt = Date.now();
})
class DownloadSchema {
  @prop() _id!: number;

  @prop({ type: String, required: true }) name!: string;
  @prop({ type: String, required: true }) description!: string;

  @prop({ type: String, required: true }) downloadUrl!: string;
  @prop({ type: String, required: true }) imageUrl!: string;

  @prop({ type: [String], default: [] }) tags!: Tag[];

  @prop({ type: Number, default: 0 }) downloads!: number; // TODO: use this

  @prop({ type: Number, default: Date.now }) createdAt!: number;
  @prop({ type: Number, default: Date.now }) updatedAt!: number;
  @prop({ autopopulate: true, ref: () => UserSchema }) createdBy!: Ref<UserSchema>;
}

export type DownloadDocument = DocumentType<DownloadSchema>;

export const Download = getModelForClass(DownloadSchema);
