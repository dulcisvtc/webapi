import { ForbiddenException, Injectable } from "@nestjs/common";
import crypto from "crypto";
import type { Request } from "express";
import config from "../../config";
import type { JobSchema, TrackSimJobWebhookObject } from "../../../types";
import { handleDelivery } from "../../handlers/jobs";

@Injectable()
export class WebhookService {
    async handleTracksim(req: Request, body: string): Promise<any> {
        if (!config.tracksim_secrets.some((secret) =>
            req.headers["tracksim-signature"] === hmacSHA256(secret, body)
        )) throw new ForbiddenException("Invalid signature");

        const parsed = JSON.parse(body) as TrackSimJobWebhookObject;

        const job = parsed.data.object;

        const newJobObject: JobSchema = {
            ts_job_id: job.id,
            driver: {
                id: job.driver.id,
                steam_id: job.driver.steam_id,
                username: job.driver.username
            },
            start_timestamp: new Date(job.start_time).getTime(),
            stop_timestamp: new Date(job.stop_time).getTime(),
            driven_distance: job.driven_distance,
            fuel_used: job.fuel_used,
            cargo: {
                name: job.cargo.name,
                mass: job.cargo.mass,
                damage: job.cargo.damage
            },
            source_city: job.source_city.name,
            source_company: job.source_company.name,
            destination_city: job.destination_city.name,
            destination_company: job.destination_company.name,
            truck: `${job.truck.brand.name} ${job.truck.name}`,
            average_speed: job.truck.average_speed * 3.6,
            top_speed: job.truck.top_speed * 3.6
        };

        await handleDelivery(newJobObject);

        return { message: "OK" };
    };
};

function hmacSHA256(key: string, data: any) {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
};