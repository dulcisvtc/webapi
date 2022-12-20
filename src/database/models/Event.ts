import { DocumentType, getModelForClass, modelOptions, prop, Severity } from "@typegoose/typegoose";

const saveQueue = new Map<string, 1 | 2>();

@modelOptions({ schemaOptions: { collection: "events" }, options: { allowMixed: Severity.ALLOW } })
class EventSchema {
    @prop({ type: Number, unique: true, required: true }) id!: number;
    @prop({ type: String, default: "" }) location!: string;
    @prop({ type: String, default: "" }) destination!: string;
    @prop({ type: Number, default: 0 }) meetup!: number;
    @prop({ type: Number, default: 0 }) departure!: number;
    @prop({ type: String, default: "" }) slot_image!: string;

    safeSave(this: EventDocument): void {
        if (saveQueue.has(this.id)) return void saveQueue.set(this.id, 2);

        saveQueue.set(this.id, 1);
        return void this.save().then(() => {
            if (saveQueue.get(this.id) === 2) {
                saveQueue.delete(this.id);
                this.safeSave();
            } else saveQueue.delete(this.id);
        });
    };
};

export type EventDocument = DocumentType<EventSchema>;

export const Event = getModelForClass(EventSchema);