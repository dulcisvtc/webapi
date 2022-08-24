import { inspect } from "util";
import { Config } from "../types";
import { connection } from "./database";
import { logger } from "./handlers/logger";
export const config = require("../config") as Config;

require("./server");
require("./bot");
connection.then(() => logger.info("Connected to database"));

process.on("unhandledRejection", (e) => logger.error("unhandledRejection: " + inspect(e)));
process.on("uncaughtException", (e) => logger.error("uncaughtException: " + inspect(e)));
logger.info("=".repeat(55));