export default {
    token: String(process.env["DISCORD_TOKEN"]),
    database_uri: String(process.env["DATABASE_URI"]),

    navio_secrets: String(process.env["NAVIO_SECRETS"]).split(","),
    messaging_secret: String(process.env["MESSAGING_SECRET"]),

    guild: String(process.env["GUILD_ID"]),
    driver_role: String(process.env["DRIVER_ROLE_ID"]),

    port: parseInt(process.env["PORT"] ?? "") || 3000
};