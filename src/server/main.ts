import { NestFactory } from "@nestjs/core";
import config from "../config";
import { AppModule } from "./app.module";

export async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: "*"
        }
    });

    await app.listen(config.port);
};