import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Injectable, NotFoundException } from "@nestjs/common";
import sharp from "sharp";
import { guild } from "../..";
import { Jobs, User } from "../../database";
import config from "../../config";

@Injectable()
export class UsersService {
    async getUsers() {
        const users = await User.find({}, "-_id -__v").lean();

        return users;
    };

    async getUserBanner(query: string) {
        const user = await User.findOne({ $text: { $search: query } }, "-_id -__v").lean();

        if (!user) throw new NotFoundException("User not found");

        const [member, bg, [{ truck }], [{ litres }], jobs] = await Promise.all([
            guild!.members.fetch(user.discord_id),
            loadImage("https://i.proxied.host/u/HtWDnP.png"),
            Jobs.aggregate([
                { $match: { "driver.steam_id": user.steam_id } },
                {
                    $group: {
                        _id: '$truck',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 1 },
                { $project: { _id: 0, truck: "$_id" } }
            ]) as unknown as Promise<[{ truck: string }]>,
            Jobs.aggregate([
                { $match: { "driver.steam_id": user.steam_id } },
                {
                    $group: {
                        _id: null,
                        litres: { $sum: "$fuel_used" },
                    },
                },
                { $project: { _id: 0, litres: "$litres" } }
            ]) as unknown as Promise<[{ litres: number }]>,
            Jobs.find({ "driver.steam_id": user.steam_id }).count()
        ]);
        const pfp = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 512 })).then(async (i) => {
            const w = 204;
            const r = w / 2;
            const circle = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);

            return loadImage(
                await sharp(i.src)
                    .resize(w, w)
                    .composite([{ input: circle, blend: "dest-in" }])
                    .png()
                    .toBuffer()
            );
        });

        const canvas = createCanvas(1920, 350);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(bg, 0, 0, 1920, 350);
        ctx.drawImage(pfp, 1026, 70, 204, 204);

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Stats
        ctx.font = "regular 40px Open Sans";
        ctx.fillText(`${user.leaderboard.monthly_mileage.toLocaleString()} KM`, 346, 58);
        ctx.fillText(`${user.leaderboard.alltime_mileage.toLocaleString()} KM`, 292, 123);
        ctx.fillText(`${truck}`, 338, 190);
        ctx.fillText(`${Math.round(litres).toLocaleString()} L`, 217, 256);
        ctx.fillText(`${jobs.toLocaleString()}`, 136, 323);
        // Stats end

        // User name
        ctx.font = "regular 100px Open Sans";
        ctx.fillText(member.user.username, 1246, 172);
        // User name end

        // User role
        const role = member.roles.cache
            .filter(({ id }) => config.trackedRoles.includes(id))
            .sort((a, b) => b.rawPosition - a.rawPosition)
            .first();
        ctx.font = "regular 50px Open Sans";
        ctx.fillStyle = role?.color ? `#${role.color.toString(16)}` : "#ffffff";
        ctx.fillText(`${role?.name ?? "Unknown"}`, 1246, 251);
        // User role end

        console.log("ae")

        return canvas.toBuffer("image/png");
    };

    async getUser(discordId: string) {
        const user = await User.findOne({ discord_id: discordId }, "-_id -__v").lean();

        if (!user) throw new NotFoundException("User not found");

        return user;
    };
};