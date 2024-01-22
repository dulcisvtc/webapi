import { Process, Processor } from "@nestjs/bull";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bull";
import type { Cache } from "cache-manager";
import ms from "ms";
import { UsersService } from "../services/users.service";
import { GenerateBannerJobData } from "../types/users";

@Processor("users")
export class UsersProcessor {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private usersService: UsersService
  ) {}

  private readonly logger = new Logger(UsersProcessor.name);

  @Process("generate_banner")
  async generateBanner(job: Job<GenerateBannerJobData>) {
    const start = Date.now();
    const steamId = job.data.steamId;

    const user = await this.usersService.getUser(steamId);
    const banner = await this.usersService.getUserBanner(steamId);

    await this.cacheManager.set(`${steamId}-banner`, banner.toString("base64"), ms("7d"));

    this.logger.debug(`Generated banner for ${user.username}[${steamId}] in ${Date.now() - start}ms`);
  }
}
