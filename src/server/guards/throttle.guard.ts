import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected override async getTracker(req: Request): Promise<string> {
    return req.ips.length ? req.ips[0]! : req.ip; // individualize IP extraction to meet your own needs
  }
}
