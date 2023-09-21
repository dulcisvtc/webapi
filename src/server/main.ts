import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import config from "../config";
import { AppModule } from "./modules/app.module";

export async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: "*"
        },
        rawBody: true
    });

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(config.port);
};