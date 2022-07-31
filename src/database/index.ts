import mongoose from "mongoose";
import { Config } from "../../types";
const config = require("../../config") as Config;

export const connection = mongoose.connect(config.database_uri);

export * from "./models/Jobs";
export * from "./models/Users";