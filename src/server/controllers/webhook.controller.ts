import { Body, Controller, Post, Req, type RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import type { TrackSimJobWebhookObject } from "../../../types";
import { WebhookService } from "../services/webhook.service";

@Controller("webhook")
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post("tracksim")
  async postTracksim(@Req() req: RawBodyRequest<Request>, @Body() body: TrackSimJobWebhookObject): Promise<any> {
    return await this.webhookService.handleTracksim(req, body);
  }
}
