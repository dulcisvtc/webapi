import { DocumentType, getModelForClass, modelOptions, prop, PropType, Severity } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "wordchannels" }, options: { allowMixed: Severity.ALLOW } })
class WordchannelSchema {
    @prop({ type: String, default: "" }) word!: string;
    @prop({ type: String, default: "" }) user!: string;
    @prop({ type: String, default: "" }) message!: string;
    @prop({ type: Map, default: {} }, PropType.MAP) leaderboard!: Map<string, number>;
};

export type WordchannelDocument = DocumentType<WordchannelSchema>;

export const Wordchannel = getModelForClass(WordchannelSchema);