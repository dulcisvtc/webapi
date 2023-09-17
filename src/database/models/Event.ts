import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "events" }, options: { allowMixed: Severity.ALLOW } })
class EventSchema {
    @prop({ type: Number, unique: true, required: true }) id!: number;
    @prop({ type: String, default: "" }) location!: string;
    @prop({ type: String, default: "" }) destination!: string;
    @prop({ type: Number, default: 0 }) meetup!: number;
    @prop({ type: Number, default: 0 }) departure!: number;
    @prop({ type: String }) slotId?: string;
    @prop({ type: String }) slotImage?: string;
    @prop({ type: String }) notes?: string;
};

export type EventDocument = DocumentType<EventSchema>;

export const Event = getModelForClass(EventSchema);