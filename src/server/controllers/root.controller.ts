import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { isURL } from "class-validator";
import type { GlobalDocument } from "../../database";
import { RootService, Stats } from "../services/root.service";

@Controller()
export class RootController {
  constructor(private rootService: RootService) {}

  @Get("stats")
  async findStats(): Promise<Stats> {
    return await this.rootService.getStats();
  }

  @Get("metrics")
  async findMetrics(): Promise<GlobalDocument["metrics"]> {
    return await this.rootService.getMetrics();
  }

  @Get("jobs")
  async findJobs(
    @Query("limit") limit?: string,
    @Query("skip") skip?: string,
    @Query("steamids") steamids?: string
  ): Promise<any> {
    const parsedLimit = parseInt(limit || "10");
    const parsedSkip = parseInt(skip || "0");
    const parsedSteamids = steamids?.split(",") || [];

    return await this.rootService.getJobs(parsedLimit, parsedSkip, parsedSteamids);
  }

  @Get("render")
  async render(@Query("url") url: string): Promise<string> {
    if (!isURL(url)) throw new BadRequestException("Invalid URL.");

    return await this.rootService.render(url);
  }
}
