import { prisma } from "../prisma.js";
import { addMoney } from "./economyService.js";
import { addDistrictPoints } from "./districtService.js";
import { logAudit } from "./auditLogService.js";

export async function createDailyMissions(guildId) {
    await prisma.missao.createMany({
        data: [
            { guildId, tipo: "daily_messages", objetivo: 50, recompensa: 100, ativa: true },
            { guildId, tipo: "daily_event", objetivo: 1, recompensa: 150, ativa: true },
            { guildId, tipo: "daily_active", objetivo: 120, recompensa: 200, ativa: true }
        ]
    });
}

export async function createWeeklyMissions(guildId) {
    await prisma.missao.createMany({
        data: [
            { guildId, tipo: "weekly_recruits", objetivo: 2, recompensa: 300, ativa: true },
            { guildId, tipo: "weekly_war", objetivo: 1, recompensa: 400, ativa: true },
            { guildId, tipo: "weekly_event", objetivo: 1, recompensa: 350, ativa: true }
        ]
    });
}

export async function resetMissions(guildId) {
    await prisma.missao.updateMany({ where: { guildId }, data: { ativa: false } });
    await createDailyMissions(guildId);
    await createWeeklyMissions(guildId);
}

export async function rewardMission(guildId, discordId, missionId) {
    const mission = await prisma.missao.findUnique({ where: { id: missionId } });
    if (!mission || !mission.ativa) {
        throw new Error("Missão inválida.");
    }
    await addMoney(guildId, discordId, mission.recompensa, "missao");
    return mission;
}

export async function createSeasonDistrictMissions(guildId, temporadaId) {
    const districts = await prisma.distrito.findMany({ where: { guildId } });
    if (districts.length === 0) return [];
    const data = [];
    for (const district of districts) {
        data.push(
            {
                guildId,
                distritoId: district.id,
                temporadaId,
                tipo: "season_messages",
                objetivo: 5000,
                recompensa: 500,
                ativa: true
            },
            {
                guildId,
                distritoId: district.id,
                temporadaId,
                tipo: "season_recruits",
                objetivo: 30,
                recompensa: 400,
                ativa: true
            },
            {
                guildId,
                distritoId: district.id,
                temporadaId,
                tipo: "season_events",
                objetivo: 10,
                recompensa: 350,
                ativa: true
            }
        );
    }
    await prisma.missaoDistrito.createMany({ data });
    return data;
}

export async function addDistrictMissionProgress(guildId, distritoId, tipo, amount) {
    if (!distritoId) return [];
    const missions = await prisma.missaoDistrito.findMany({
        where: { guildId, distritoId, tipo, ativa: true }
    });
    const completed = [];
    for (const mission of missions) {
        const updated = await prisma.missaoDistrito.update({
            where: { id: mission.id },
            data: { progresso: { increment: amount } }
        });
        if (updated.progresso >= updated.objetivo) {
            await prisma.missaoDistrito.update({
                where: { id: updated.id },
                data: { ativa: false }
            });
            await addDistrictPoints(guildId, distritoId, updated.recompensa);
            await logAudit({
                guildId,
                action: "district_mission.complete",
                actorId: null,
                targetId: distritoId,
                source: "mission",
                meta: { missionId: updated.id, tipo, recompensa: updated.recompensa }
            });
            completed.push(updated);
        }
    }
    return completed;
}

export async function getActiveDistrictMissions(guildId, distritoId) {
    return prisma.missaoDistrito.findMany({
        where: { guildId, distritoId, ativa: true }
    });
}
