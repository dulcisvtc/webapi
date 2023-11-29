import { Injectable } from "@nestjs/common";
import axios from "axios";
import { isCurrentMonth } from "../../constants/time";
import { GlobalDocument, Jobs, User, getGlobalDocument } from "../../database";

@Injectable()
export class RootService {
  async getStats(): Promise<Stats> {
    const drivers = await User.countDocuments();
    const jobs = await Jobs.find({}, "driven_distance fuel_used stop_timestamp -_id").lean();

    let mjobs = 0;
    let distance = 0;
    let mdistance = 0;
    let fuel = 0;

    for (const { driven_distance, fuel_used, stop_timestamp } of jobs) {
      distance += driven_distance;
      fuel += fuel_used;

      if (isCurrentMonth(stop_timestamp)) {
        mdistance += driven_distance;
        mjobs++;
      }
    }

    distance = Math.round(distance);
    mdistance = Math.round(mdistance);
    fuel = Math.round(fuel);

    return {
      drivers,
      jobs: jobs.length,
      mjobs,
      distance,
      mdistance,
      fuel,
    };
  }

  async getMetrics(): Promise<GlobalDocument["metrics"]> {
    const document = await getGlobalDocument();

    return JSON.parse(JSON.stringify(document.metrics));
  }

  async getJobs(limit: number, skip: number, steamids: string[]): Promise<any> {
    const filter = steamids.length ? { "driver.steam_id": { $in: steamids } } : {};

    const jobs = await Jobs.find(filter, "-_id -__v").sort({ stop_timestamp: -1 }).skip(skip).limit(limit).lean();

    return jobs;
  }

  async render(url: string): Promise<string> {
    const r = await axios.get<string>(url, { responseType: "text" });

    return r.data;
  }
}

export interface Stats {
  drivers: number;
  jobs: number;
  mjobs: number;
  distance: number;
  mdistance: number;
  fuel: number;
}
