import { Controller, Post, RawBodyRequest, Req } from "@nestjs/common";
import type { Request } from "express";
import { WebhookService } from "./webhook.service";

@Controller("webhook")
export class WebhookController {
    constructor(private webhookService: WebhookService) { };

    @Post("tracksim")
    async postTracksim(
        @Req() req: RawBodyRequest<Request>
    ): Promise<any> {
        return await this.webhookService.handleTracksim(req);
    };
};