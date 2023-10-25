import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "linked-role-users" }, options: { allowMixed: Severity.ALLOW } })
class LinkedRoleUserSchema {
  @prop({ type: String, required: true, unique: true }) discord_id!: string;
  @prop({ type: String, required: true }) access_token!: string;
  @prop({ type: String, unique: true, required: true }) refresh_token!: string;
  @prop({ type: Date, required: true }) lastRefreshed!: Date;
}

export type LinkedRoleUserDocument = DocumentType<LinkedRoleUserSchema>;

export const LinkedRoleUser = getModelForClass(LinkedRoleUserSchema);
