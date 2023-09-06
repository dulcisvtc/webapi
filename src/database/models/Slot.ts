import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class SlotInfoSchema {
    @prop({ type: Number, default: 0 }) vtcId!: number;
    @prop({ type: Boolean, default: false }) taken!: boolean;
    @prop({ type: String, default: "" }) displayName!: string;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class LocationSchema {
    @prop({ type: String, required: true }) name!: string;
    @prop({ type: String, required: true }) imageUrl!: string;
    @prop({ type: SlotInfoSchema, default: {} }, PropType.MAP) slots!: Map<string, SlotInfoSchema>;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class ChunkSchema {
    @prop({ type: String, default: "" }) messageId!: string;
    @prop({ type: [LocationSchema], default: [] }, PropType.ARRAY) locations!: LocationSchema[];
};

@modelOptions({ schemaOptions: { collection: "slots" }, options: { allowMixed: Severity.ALLOW } })
class SlotSchema {
    @prop({ type: Number, unique: true, required: true }) eventId!: number;
    @prop({ type: String, unique: true, required: true }) infoChannelId!: string;
    @prop({ type: String, unique: true, required: true }) slotsChannelId!: string;
    @prop({ type: [ChunkSchema], default: [] }, PropType.ARRAY) chunks!: ChunkSchema[];
};

export type SlotDocument = DocumentType<SlotSchema>;

export const Slot = getModelForClass(SlotSchema);