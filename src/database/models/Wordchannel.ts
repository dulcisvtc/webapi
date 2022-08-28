import { model, Schema } from "mongoose";
import type { WordchannelSchema } from "../../../types";

const WordchannelObject: WordchannelSchema = {
    word: "",
    user: "",
    message: "",
    leaderboard: {}
};

const WordchannelSchema = new Schema<WordchannelSchema>(WordchannelObject);
export const Wordchannel = model<WordchannelSchema>("Wordchannel", WordchannelSchema);