import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

let state: 0 | 1 | 2 = 0;

@modelOptions({ schemaOptions: { collection: "wordchannels" }, options: { allowMixed: Severity.ALLOW } })
class WordchannelSchema {
    @prop({ type: String, default: "" }) word!: string;
    @prop({ type: String, default: "" }) user!: string;
    @prop({ type: String, default: "" }) message!: string;
    @prop({ type: Map, default: {} }, PropType.MAP) leaderboard!: Map<string, number>;

    safeSave(this: WordchannelDocument): void {
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

export type WordchannelDocument = DocumentType<WordchannelSchema>;

export const Wordchannel = getModelForClass(WordchannelSchema);