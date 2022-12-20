export default {
    token: String(process.env["DISCORD_TOKEN"]),
    database_uri: String(process.env["DATABASE_URI"]),

    navio_api_key: String(process.env["NAVIO_API_KEY"]),
    navio_secrets: String(process.env["NAVIO_SECRETS"]).split(","),
    messaging_secret: String(process.env["MESSAGING_SECRET"]),

    guild: String(process.env["GUILD_ID"]),
    driver_role: String(process.env["DRIVER_ROLE_ID"]),
    retired_driver_role: String(process.env["RETIRED_DRIVER_ROLE_ID"]),

    botlogs_channel: String(process.env["BOT_LOGS_CHANNEL"]),
    member_updates_channel: String(process.env["MEMBER_UPDATES_CHANNEL"]),

    event_channels: {
        calendar: String(process.env["EVENTS_CALENDAR_CHANNEL"]),
        attending: String(process.env["EVENTS_ATTENDING_CHANNEL"])
    },

    port: parseInt(process.env["PORT"] ?? "") || 3000
};