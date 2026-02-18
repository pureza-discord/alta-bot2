import { prisma } from "../prisma.js";
import { addDistrictPoints } from "./districtService.js";
import { addMerit } from "./userService.js";
import { logger } from "../../utils/logger.js";
import { checkPromotion } from "./promotionService.js";
import { logAudit } from "./auditLogService.js";

export async function challengeWar(guildId, distritoA, distritoB) {
    const existing = await prisma.guerra.findFirst({
        where: {
            guildId,
            status: { in: ["pending", "active"] },
            OR: [
                { distritoA, distritoB },
                { distritoA: distritoB, distritoB: distritoA }
            ]
        }
    });
    if (existing) {
        throw new Error("Já existe uma guerra pendente/ativa entre esses distritos.");
    }

    const war = await prisma.guerra.create({
        data: {
            guildId,
            distritoA,
            distritoB,
            status: "pending"
        }
    });
    logger.info("war_challenge", { guildId, distritoA, distritoB, warId: war.id });
    await logAudit({
        guildId,
        action: "war.challenge",
        actorId: null,
        targetId: null,
        source: "war",
        meta: { distritoA, distritoB, warId: war.id }
    });
    return war;
}

export async function acceptWar(guildId, warId) {
    const war = await prisma.guerra.update({
        where: { id: warId },
        data: { status: "active", startedAt: new Date() }
    });
    logger.info("war_accept", { guildId, warId });
    await logAudit({
        guildId,
        action: "war.accept",
        actorId: null,
        targetId: null,
        source: "war",
        meta: { warId }
    });
    return war;
}

export async function finalizeWar(guildId, warId, vencedorId, participants = [], guild = null) {
    const war = await prisma.guerra.update({
        where: { id: warId },
        data: { status: "finished", vencedorId, endedAt: new Date() }
    });
    await addDistrictPoints(guildId, vencedorId, 100);
    for (const participant of participants) {
        await addMerit(guildId, participant, 1);
    }
    if (guild) {
        for (const participant of participants) {
            await checkPromotion(guild, participant, guildId);
        }
    }
    logger.info("war_finish", { guildId, warId, vencedorId });
    await logAudit({
        guildId,
        action: "war.finish",
        actorId: null,
        targetId: vencedorId,
        source: "war",
        meta: { warId, participants }
    });
    return war;
}

export async function addWarPoints(guildId, distritoId, amount) {
    const active = await prisma.guerra.findFirst({
        where: { guildId, status: "active" }
    });
    if (!active) return null;
    if (active.distritoA !== distritoId && active.distritoB !== distritoId) return null;
    await addDistrictPoints(guildId, distritoId, amount);
    return active;
}

export async function getActiveWar(guildId) {
    return prisma.guerra.findFirst({ where: { guildId, status: "active" } });
}
