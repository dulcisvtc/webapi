import { GlobalFonts, createCanvas, loadImage } from "@napi-rs/canvas";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cache } from "cache-manager";
import { REST, Routes } from "discord.js";
import ms from "ms";
import sharp from "sharp";
import { inspect } from "util";
import { guild } from "../..";
import config from "../../config";
import { Jobs, LinkedRoleUser, User, UserDocument, getUserDocumentByDiscordId } from "../../database";

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  logger = new Logger(UsersService.name);

  async getUsers() {
    const users = await User.find({}, "-_id -__v").lean();

    return users;
  }

  async getUserBanner(user: UserDocument) {
    const startOfMonth = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth());

    GlobalFonts.registerFromPath("files/OpenSans-Bold.ttf", "Open Sans");
    GlobalFonts.registerFromPath("files/OpenSans-Regular.ttf", "Open Sans");

    const [member, bg, [{ truck }], [{ litres }], jobs, ge] = await Promise.all([
      guild!.members.fetch(user.discord_id),
      loadImage("https://i.proxied.host/u/HtWDnP.png"),
      Jobs.aggregate([
        { $match: { "driver.steam_id": user.steam_id } },
        {
          $group: {
            _id: "$truck",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
        { $project: { _id: 0, truck: "$_id" } },
      ]) as unknown as Promise<[{ truck: string }]>,
      Jobs.aggregate([
        { $match: { "driver.steam_id": user.steam_id } },
        {
          $group: {
            _id: null,
            litres: { $sum: "$fuel_used" },
          },
        },
        { $project: { _id: 0, litres: "$litres" } },
      ]) as unknown as Promise<[{ litres: number }]>,
      Jobs.find({ "driver.steam_id": user.steam_id }).countDocuments(),
      Jobs.aggregate<{ monthly: number }>([
        { $match: { "driver.steam_id": user.steam_id, stop_timestamp: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            monthly: { $sum: "$driven_distance" },
          },
        },
        { $project: { _id: 0, monthly: "$monthly" } },
      ]),
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

    const monthlyDistance = ge[0]?.monthly ?? 0;

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
    ctx.fillText(`${monthlyDistance.toLocaleString()} KM`, 346, 58);
    ctx.fillText(`${user.leaderboard.alltime_mileage.toLocaleString()} KM`, 292, 123);
    ctx.fillText(`${truck}`, 338, 190);
    ctx.fillText(`${Math.round(litres).toLocaleString()} L`, 217, 256);
    ctx.fillText(`${jobs.toLocaleString()}`, 136, 323);
    // Stats end

    // User name
    ctx.font = "regular 100px Open Sans";
    ctx.fillText(user.username, 1246, 172);
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

    return canvas.toBuffer("image/png");
  }

  async getUserCachedBanner(query: string) {
    const user = await User.findOne({ $or: [{ discord_id: query }, { steam_id: query }] });
    if (!user) throw new NotFoundException("User not found");

    const cached = await this.cacheManager.get<string>(`${user.steam_id}-banner`);
    if (cached) return Buffer.from(cached, "base64");

    const banner = await this.getUserBanner(user);
    await this.cacheManager.set(`${user.steam_id}-banner`, banner.toString("base64"), ms("7d"));

    return banner;
  }

  async getUser(discordOrSteamId: string) {
    const user = await User.findOne(
      { $or: [{ discord_id: discordOrSteamId }, { steam_id: discordOrSteamId }] },
      "-_id -__v"
    ).lean();

    if (!user) throw new NotFoundException("User not found");

    return user;
  }

  async updateUserMetadata(discord_id: string): Promise<boolean> {
    const linkedRoleUser = await LinkedRoleUser.findOne({ discord_id });
    if (!linkedRoleUser) return false;

    const document = await getUserDocumentByDiscordId(discord_id);
    if (!document) return false;

    const jobs = await Jobs.find({ "driver.steam_id": document.steam_id }).countDocuments();

    const rest = new REST({ authPrefix: "Bearer" }).setToken(linkedRoleUser.access_token);

    return !!(await rest
      .put(Routes.userApplicationRoleConnection(config.discordOauth.clientId), {
        body: {
          platform_name: "Dulcis Logistics Driver's Hub",
          platform_username: document.username,
          metadata: {
            kms: document.leaderboard.alltime_mileage,
            jobs: jobs,
          },
        },
      })
      .catch(async (err) => {
        err.response
          ? this.logger.error(
              `Failed to update linked role for ${linkedRoleUser.discord_id} ${err.response?.status}: ${inspect(
                err.response?.data
              )}`
            )
          : this.logger.error(`Failed to update linked role for ${linkedRoleUser.discord_id}: ${inspect(err)}`);

        if (err.response?.status === 401) {
          await linkedRoleUser.deleteOne();
        }
      }));
  }
}
