import mongoose from "mongoose";
import config from "../config";

export const connection = mongoose.connect(config.database_uri, {
  authSource: "admin",
});

export * from "./models/Download";
export * from "./models/Event";
export * from "./models/Global";
export * from "./models/Jobs";
export * from "./models/LinkedRoleUser";
export * from "./models/Session";
export * from "./models/Slot";
export * from "./models/User";
export * from "./models/Warn";
export * from "./models/Wordchannel";

export * from "./event";
export * from "./global";
export * from "./linkedRoleUser";
export * from "./session";
export * from "./user";
export * from "./wordchannel";
