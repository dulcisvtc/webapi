import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import morgan from "morgan";
import config from "../config";
import { AppModule } from "./modules/app.module";
import type { Request } from "express";

export async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: "*"
        },
        rawBody: true
    });

    app.use("trust proxy", (ip: string) => {
        return ["::ffff:172.23.0.1"].includes(ip);
    });
    morgan.token("ip", (req: Request) => req.ips.length ? req.ips[0]! : req.ip);
    app.use(morgan(":ip [:date] \":method :url HTTP/:http-version\" :status :res[content-length] - :response-time ms"));

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(config.port);
};