import cron from "node-cron";
import { resetMissions } from "./missionService.js";
import { endSeason } from "./seasonService.js";
import { expireVipForGuild } from "./vipService.js";

export function initCron(guildOrId) {
    const guildId = typeof guildOrId === "string" ? guildOrId : guildOrId.id;
    cron.schedule("0 0 * * *", async () => {
        await resetMissions(guildId);
    });
    cron.schedule("0 0 * * 0", async () => {
        await endSeason(guildId);
    });
    if (typeof guildOrId !== "string") {
        cron.schedule("0 * * * *", async () => {
            await expireVipForGuild(guildOrId);
        });
    }
}
