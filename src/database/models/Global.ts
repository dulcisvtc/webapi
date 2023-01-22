import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class MetricsSchema {
    @prop({ type: Map, default: {} }, PropType.MAP) drivers!: Map<string, number>;
    @prop({ type: Map, default: {} }, PropType.MAP) jobs!: Map<string, number>;
    @prop({ type: Map, default: {} }, PropType.MAP) distance!: Map<string, number>;
    @prop({ type: Map, default: {} }, PropType.MAP) fuel!: Map<string, number>;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class MemberSchema {
    @prop({ type: String, required: true }) id!: string;
    @prop({ type: String }) name?: string;
};

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class RoleSchema {
    @prop({ type: String, required: true }) name!: string;
    @prop({ type: String, required: true }) color!: string;
    @prop({ type: MemberSchema, default: {} }, PropType.MAP) members!: Map<string, MemberSchema>;
};

let state: 0 | 1 | 2 = 0;

@modelOptions({ schemaOptions: { collection: "global" }, options: { allowMixed: Severity.ALLOW } })
class GlobalSchema {
    @prop({ type: MetricsSchema, default: {} }) metrics!: MetricsSchema;
    @prop({ type: RoleSchema, default: {} }, PropType.MAP) staff!: Map<string, RoleSchema>;

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