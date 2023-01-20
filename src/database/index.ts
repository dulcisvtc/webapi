import mongoose from "mongoose";
import config from "../config";

export const connection = mongoose.connect(config.database_uri);

export * from "./models/Event";
export * from "./models/Global";
export * from "./models/Jobs";
export * from "./models/User";
export * from "./models/Wordchannel";

export * from "./event";
export * from "./global";
export * from "./user";
export * from "./wordchannel";