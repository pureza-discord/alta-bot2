import cron from "node-cron";
import { info, warn } from "../utils/logger.js";
import { checkWarEnd as checkWarEndService } from "../services/warService.js";
import { User } from "../models/User.js";
import { resetDaily } from "../services/missionService.js";
import { checkSeasonEnd as checkSeasonEndService } from "../services/seasonService.js";
import { expireContracts } from "../services/contractService.js";
import { awardWeeklyMover } from "../services/chatAnalyticsService.js";

export async function resetWeeklyRanking() {
    await User.updateMany({}, { $set: { weeklyXP: 0 } });
    await awardWeeklyMover();
    info("Ranking semanal resetado.");
}

export async function resetDailyMissions() {
    await resetDaily();
    await expireContracts();
    info("Missões diárias resetadas.");
}

export async function checkSeasonEnd() {
    try {
        await checkSeasonEndService();
    } catch (err) {
        warn("Erro ao checar fim da temporada", { error: err.message });
    }
}

export async function checkWarEnd() {
    try {
        await checkWarEndService();
    } catch (err) {
        warn("Erro ao checar fim da guerra", { error: err.message });
    }
}

export function initJobs() {
    cron.schedule("0 0 * * 1", resetWeeklyRanking);
    cron.schedule("0 0 * * *", resetDailyMissions);
    cron.schedule("0 * * * *", checkSeasonEnd);
    cron.schedule("*/5 * * * *", checkWarEnd);
    info("Jobs agendados com sucesso.");
}
