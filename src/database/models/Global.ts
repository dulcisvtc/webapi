import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class MetricsSchema {
    @prop({ type: Map, default: {} }, PropType.MAP) drivers!: Map<string, number>;
    @prop({ type: Map, default: {} }, PropType.MAP) jobs!: Map<string, number>;
    @prop({ type: Map, default: {} }, PropType.MAP) distance!: Map<string, number>;
    @prop({ type: Map, default: {} }, PropType.MAP) fuel!: Map<string, number>;
};

let state: 0 | 1 | 2 = 0;

@modelOptions({ schemaOptions: { collection: "global" }, options: { allowMixed: Severity.ALLOW } })
class GlobalSchema {
    @prop({ type: MetricsSchema, default: {} }) metrics!: MetricsSchema;

    safeSave(this: GlobalDocument): void {
        if (state) return state = 2, void 0;

        state = 1;
        return void this.save().then(() => {
            if (state === 2) {
                state = 0;
                this.safeSave();
            } else state = 0;
        });
    };
};

export type GlobalDocument = DocumentType<GlobalSchema>;

export const Global = getModelForClass(GlobalSchema);