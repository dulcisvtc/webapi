import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import type { APICompanyMembers, APIGameEvent } from "@truckersmp_official/api-types/v2";
import type { Cache } from "cache-manager";
import ms from "ms";
import http from "../../lib/http";

@Injectable()
export class TMPService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getMembers(): Promise<{ response: APICompanyMembers }> {
    const data = (await http.get<{ response: APICompanyMembers }>("https://api.truckersmp.com/v2/vtc/55939/members")).data;

    return data;
  }

  async getEvent(id: number): Promise<{ response: APIGameEvent }> {
    const cached = await this.cacheManager.get<{ response: APIGameEvent }>(`event-${id}`);
    if (cached) return cached;

    const data = (await http.get<{ response: APIGameEvent }>(`https://api.truckersmp.com/v2/events/${id}`)).data;
    await this.cacheManager.set(`event-${id}`, data, ms("30m"));
    return data;
  }
}
