import { createLogger, format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const transport = new DailyRotateFile({
    filename: path.join(__dirname, "..", "..", "logs", "%DATE%-debug.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: false,
    maxSize: "32m",
    maxFiles: "14d"
});

export const debug = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        transport
    ]
});