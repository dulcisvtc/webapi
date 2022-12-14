import mongoose from "mongoose";
import config from "../config";

export const connection = mongoose.connect(config.database_uri);

export * from "./models/Jobs";
export * from "./user";
export * from "./wordchannel";