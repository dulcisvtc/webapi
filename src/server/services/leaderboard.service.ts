import { Injectable } from "@nestjs/common";
import { Jobs, User } from "../../database";
import type { LeaderboardUser } from "../types/leaderboard";

@Injectable()
export class LeaderboardService {
  async getMonthly(year: number, month: number): Promise<LeaderboardUser[]> {
    const startTimestamp = Date.UTC(year, month);
    const endTimestamp = Date.UTC(year, month + 1);

    const users = await Jobs.aggregate<LeaderboardUser>([
      {
        $match: {
          "driver.steam_id": { $exists: true },
          stop_timestamp: { $gte: startTimestamp, $lt: endTimestamp },
        },
      },
      {
        $group: {
          _id: "$driver.steam_id",
          distance: { $sum: "$driven_distance" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "steam_id",
          as: "user",
        },
      },
      { $set: { username: { $arrayElemAt: ["$user.username", 0] } } },
      { $unwind: "$user" },
      { $unset: "user" },
      { $sort: { distance: -1 } },
      {
        $group: {
          _id: null,
          results: { $push: "$$ROOT" },
        },
      },
      {
        $unwind: {
          path: "$results",
          includeArrayIndex: "position",
        },
      },
      {
        $addFields: {
          "results.position": { $add: ["$position", 1] },
        },
      },
      { $replaceRoot: { newRoot: "$results" } },
      {
        $project: {
          _id: 0,
          steamId: "$_id",
          username: 1,
          distance: 1,
          position: 1,
        },
      },
    ]);

    return users;
  }

  async getAllTime(): Promise<LeaderboardUser[]> {
    const users = await User.aggregate<LeaderboardUser>([
      { $match: { "leaderboard.alltime_mileage": { $gte: 1 } } },
      { $sort: { "leaderboard.alltime_mileage": -1 } },
      { $group: { _id: "$name", items: { $push: "$$ROOT" } } },
      { $unwind: { path: "$items", includeArrayIndex: "items.position" } },
      {
        $project: {
          _id: 0,
          steamId: "$items.steam_id",
          username: "$items.username",
          distance: "$items.leaderboard.alltime_mileage",
          position: { $add: ["$items.position", 1] },
        },
      },
    ]);

    return users;
  }
}
