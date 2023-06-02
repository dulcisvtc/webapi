import { Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { PlainBody } from "../decorators";
import { WebhookService } from "./webhook.service";

@Controller("webhook")
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) { };

    @Post("tracksim")
    async postTracksim(
        @Req() req: Request,
        @PlainBody() body: string
    ): Promise<any> {
        return await this.webhookService.handleTracksim(req, body);
    };
};