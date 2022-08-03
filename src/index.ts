import { Config } from "../types";
import { connection } from "./database";
import { logger } from "./handlers/logger";
export const config = require("../config") as Config;

require("./server");
require("./bot");
connection.then(() => logger.info("Connected to database"));

process.on("unhandledRejection", logger.error);
process.on("uncaughtException", logger.error);
logger.info("=".repeat(55));