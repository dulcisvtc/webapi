import axios, { AxiosError } from "axios";
import { setTimeout as sleep } from "timers/promises";
import JSONbigint from "json-bigint";

const http = axios.create({
    maxRedirects: 0,
    timeout: 30_000
});

http.interceptors.request.use((request) => {
    request.transformResponse = [data => data];

    return request;
});

http.interceptors.response.use((response) => {
    response.data = JSONbigint.parse(response.data);

    return response;
}, async (error: AxiosError) => {
    const { config } = error;

    if (!config?.retry || error.response?.status === 404)
        return Promise.reject(error);

    config.retry -= 1;

    await sleep(config.retryDelay ?? 500);

    return await http(config);
});

export default http;