import { Injectable } from "@nestjs/common";
import { User } from "../../database";
import type { LeaderboardUser } from "../types/leaderboard";

@Injectable()
export class LeaderboardService {
    async getMonthly(): Promise<LeaderboardUser[]> {
        const users = await User.aggregate<LeaderboardUser>([
            { $match: { "leaderboard.monthly_mileage": { $gte: 1 } } },
            { $sort: { "leaderboard.monthly_mileage": -1 } },
            { $group: { _id: "$name", items: { $push: "$$ROOT" } } },
            { $unwind: { path: "$items", includeArrayIndex: "items.position" } },
            {
                $project: {
                    _id: 0,
                    steamId: "$items.steam_id",
                    username: "$items.username",
                    distance: "$items.leaderboard.monthly_mileage",
                    position: { $add: ["$items.position", 1] }
                }
            }
        ]);

        return users;
    };

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
                    position: { $add: ["$items.position", 1] }
                }
            }
        ]);

        return users;
    };
};