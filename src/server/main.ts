import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import morgan from "morgan";
import config from "../config";
import { AppModule } from "./modules/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: "*",
    },
    rawBody: true,
  });

  app.set("trust proxy", (ip: string) => {
    return ["::ffff:172.21.0.1", "::ffff:172.23.0.1"].includes(ip);
  });
  app.use(morgan(':remote-addr [:date] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms'));

  app.useGlobalPipes(new ValidationPipe());

  const openapi = new DocumentBuilder()
    .setTitle("Dulcis Logistics API")
    .setDescription("API for Dulcis Logistics")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openapi);
  SwaggerModule.setup("docs", app, document);

  await app.listen(config.port);
}
