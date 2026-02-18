import { prisma } from "../prisma.js";
import { addEventParticipation, addInfluence, addMoney, getUser } from "./userService.js";
import { addWarPoints } from "./warService.js";
import { checkPromotion } from "./promotionService.js";
import { logger } from "../../utils/logger.js";
import { logAudit } from "./auditLogService.js";
import { addDistrictMissionProgress } from "./missionService.js";

export async function createEvent(guildId, nome, criadoPor) {
    const event = await prisma.evento.create({
        data: { guildId, nome, criadoPor, participantes: [] }
    });
    await logAudit({
        guildId,
        action: "event.create",
        actorId: criadoPor,
        targetId: null,
        source: "event",
        meta: { eventId: event.id, nome }
    });
    return event;
}

export async function registerParticipant(guildId, eventId, userId) {
    const event = await prisma.evento.findFirst({ where: { id: eventId, guildId } });
    if (!event) {
        throw new Error("Evento não encontrado.");
    }
    if (event.participantes.includes(userId)) return event;
    const updated = await prisma.evento.update({
        where: { id: eventId },
        data: { participantes: { push: userId } }
    });
    await logAudit({
        guildId,
        action: "event.join",
        actorId: userId,
        targetId: null,
        source: "event",
        meta: { eventId }
    });
    return updated;
}

export async function finalizeEvent(guildId, eventId, vencedorId, distritoId, guild = null) {
    const event = await prisma.evento.update({
        where: { id: eventId },
        data: { vencedorId }
    });
    logger.info("event_finish", { guildId, eventId, vencedorId });
    await logAudit({
        guildId,
        action: "event.finish",
        actorId: null,
        targetId: vencedorId,
        source: "event",
        meta: { eventId, distritoId }
    });
    await addEventParticipation(guildId, vencedorId, 1);
    await addInfluence(guildId, vencedorId, 5);
    await addMoney(guildId, vencedorId, 25);
    if (distritoId) {
        await addWarPoints(guildId, distritoId, 10);
        await addDistrictMissionProgress(guildId, distritoId, "season_events", 1);
    }
    if (guild) {
        await checkPromotion(guild, vencedorId, guildId);
    }
    return event;
}
