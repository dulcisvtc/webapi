import { Module } from "@nestjs/common";
import { WebhookController } from "../controllers/webhook.controller";
import { WebhookService } from "../services/webhook.service";
import { UsersModule } from "./users.module";

@Module({
  imports: [UsersModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
