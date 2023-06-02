import { Injectable } from "@nestjs/common";
import type { APICompanyMembers, APICompanyNews, APIGameEvent } from "@truckersmp_official/api-types/v2";
import http from "../../lib/http";

@Injectable()
export class TMPService {
    async getNews(): Promise<{ response: APICompanyNews }> {
        const data = (await http.get<{ response: APICompanyNews }>("https://api.truckersmp.com/v2/vtc/55939/news")).data;

        return data;
    };

    async getMembers(): Promise<{ response: APICompanyMembers }> {
        const data = (await http.get<{ response: APICompanyMembers }>("https://api.truckersmp.com/v2/vtc/55939/members")).data;

        return data;
    };

    async getEvent(id: number): Promise<{ response: APIGameEvent }> {
        const data = (await http.get<{ response: APIGameEvent }>(`https://api.truckersmp.com/v2/events/${id}`)).data;

        return data;
    };
};