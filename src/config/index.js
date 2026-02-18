import dotenv from "dotenv";

dotenv.config();

const config = {
    token: process.env.DISCORD_TOKEN || "",
    guildId: process.env.DISCORD_GUILD_ID || "",
    seasonDuration: Number(process.env.SEASON_DURATION || 30),
    warDuration: Number(process.env.WAR_DURATION || 7),
    xpFormula: process.env.XP_FORMULA || "150 * level^2 + 500",
    webPort: Number(process.env.WEB_PORT || 3000),
    jwtSecret: process.env.JWT_SECRET || "change-me",
    oauth: {
        clientId: process.env.DISCORD_CLIENT_ID || "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
        redirectUri: process.env.OAUTH_REDIRECT_URI || ""
    },
    hierarchyRoles: (() => {
        try {
            return JSON.parse(process.env.HIERARCHY_ROLES || "[]");
        } catch {
            return [];
        }
    })()
};

export { config };
