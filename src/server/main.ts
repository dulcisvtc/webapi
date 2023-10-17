import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import morgan from "morgan";
import config from "../config";
import { AppModule } from "./modules/app.module";

export async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: "*"
        },
        rawBody: true
    });

    app.use(morgan(":remote-addr [:date] \":method :url HTTP/:http-version\" :status :res[content-length] - :response-time ms"));

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(config.port);
};