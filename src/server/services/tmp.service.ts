import { CacheTTL } from "@nestjs/cache-manager";
import { Injectable } from "@nestjs/common";
import type { APICompanyMembers, APIGameEvent } from "@truckersmp_official/api-types/v2";
import ms from "ms";
import http from "../../lib/http";

@Injectable()
export class TMPService {
  async getMembers(): Promise<{ response: APICompanyMembers }> {
    const data = (await http.get<{ response: APICompanyMembers }>("https://api.truckersmp.com/v2/vtc/55939/members")).data;

    return data;
  }

  @CacheTTL(ms("30m"))
  async getEvent(id: number): Promise<{ response: APIGameEvent }> {
    const data = (await http.get<{ response: APIGameEvent }>(`https://api.truckersmp.com/v2/events/${id}`)).data;

    return data;
  }
}
