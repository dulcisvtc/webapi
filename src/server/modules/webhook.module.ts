import { Module } from "@nestjs/common";
import { WebhookController } from "../controllers/webhook.controller";
import { UsersService } from "../services/users.service";
import { WebhookService } from "../services/webhook.service";

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, UsersService],
})
export class WebhookModule {}
