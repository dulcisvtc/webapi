import axios, { AxiosInstance } from "axios";
import { MeResponse, PostDriver } from "./@types/Responses";
import JSONBigInt from "json-bigint";

export default class Navio {
    apiKey: string | null = null;
    apiURL: string = "https://api.navio.app/v1";

    private axios: AxiosInstance;

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        this.axios = axios.create({
            baseURL: this.apiURL,
            headers: {
                Authorization: `Bearer ${this.apiKey}`
            }
        });
    };

    async me(): Promise<MeResponse> {
        const res = await this.axios.get<MeResponse>("me", {
            transformResponse: (d) => d
        }).then((res) => {
            res.data = JSON.parse(JSON.stringify(JSONBigInt.parse(res.data as any as string)));
            return res.data;
        });

        return res;
    };

    async addDriver(steamId: string): Promise<PostDriver | string> {
        const res = await this.axios.post<PostDriver>("drivers", {
            steam_id: steamId
        }).then((res) => {
            return res.data
        }).catch((err) => {
            if (err.code === 401) throw err;

            return err.response.data.error.message;
        });

        return res;
    };

    async removeDriver(steamId: string): Promise<true | string> {
        const res = await this.axios.delete<true>(`drivers/${steamId}`).then(() => {
            return true;
        }).catch((err) => {
            if (err.code === 401) throw err;

            return err.response.data.error;
        });

        return res;
    };
};