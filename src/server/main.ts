import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import morgan from "morgan";
import config from "../config";
import { AppModule } from "./modules/app.module";

export async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        cors: {
            origin: "*"
        },
        rawBody: true
    });

    app.set("trust proxy", (ip: string) => {
        return ["::ffff:172.23.0.1"].includes(ip);
    });
    app.use(morgan(":remote-addr [:date] \":method :url HTTP/:http-version\" :status :res[content-length] - :response-time ms"));

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(config.port);
};