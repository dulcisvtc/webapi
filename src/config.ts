import "dotenv/config";

export default {
    token: process.env["DISCORD_TOKEN"]!,
    database_uri: process.env["DATABASE_URI"]!,

    tracksim_api_key: process.env["TRACKSIM_API_KEY"]!,
    tracksim_secrets: process.env["TRACKSIM_SECRETS"]!.split(","),

    guild: process.env["GUILD_ID"]!,
    driver_role: process.env["DRIVER_ROLE_ID"]!,
    retired_driver_role: process.env["RETIRED_DRIVER_ROLE_ID"]!,

    botlogs_channel: process.env["BOT_LOGS_CHANNEL"]!,
    member_updates_channel: process.env["MEMBER_UPDATES_CHANNEL"]!,

    event_channels: {
        calendar: process.env["EVENTS_CALENDAR_CHANNEL"]!,
        attending: process.env["EVENTS_ATTENDING_CHANNEL"]!
    },

    discordOauth: {
        clientId: process.env["DISCORD_CLIENT_ID"]!,
        clientSecret: process.env["DISCORD_CLIENT_SECRET"]!,
        redirectUri: process.env["DISCORD_REDIRECT_URI"]!
    },

    redis: {
        host: process.env["REDIS_HOST"]!,
        port: parseInt(process.env["REDIS_PORT"]!) || 6379,
        password: process.env["REDIS_PASSWORD"]!
    },

    port: parseInt(process.env["PORT"] ?? "") || 3000,

    production: process.env["NODE_ENV"] === "production"
};