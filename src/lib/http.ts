import axios, { AxiosError } from "axios";
import { setTimeout as sleep } from "timers/promises";

const http = axios.create({
    maxRedirects: 0,
    timeout: 30_000
});

http.interceptors.response.use(undefined, async (error: AxiosError) => {
    const { config } = error;

    if (!config?.retry || error.response?.status === 404)
        return Promise.reject(error);

    config.retry -= 1;

    await sleep(config.retryDelay ?? 500);

    return await http(config);
});

export default http;