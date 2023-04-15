export default {
    token: process.env["DISCORD_TOKEN"]!,
    database_uri: process.env["DATABASE_URI"]!,

    tracksim_api_key: process.env["TRACKSIM_API_KEY"]!,
    tracksim_secrets: process.env["TRACKSIM_SECRETS"]!.split(","),
    messaging_secret: process.env["MESSAGING_SECRET"]!,

    guild: process.env["GUILD_ID"]!,
    driver_role: process.env["DRIVER_ROLE_ID"]!,
    retired_driver_role: process.env["RETIRED_DRIVER_ROLE_ID"]!,

    botlogs_channel: process.env["BOT_LOGS_CHANNEL"]!,
    member_updates_channel: process.env["MEMBER_UPDATES_CHANNEL"]!,

    event_channels: {
        calendar: process.env["EVENTS_CALENDAR_CHANNEL"]!,
        attending: process.env["EVENTS_ATTENDING_CHANNEL"]!
    },

    port: parseInt(process.env["PORT"] ?? "") || 3000,

    production: process.env["NODE_ENV"] === "production"
};