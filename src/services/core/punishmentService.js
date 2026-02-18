import { prisma } from "../prisma.js";
import { logAudit } from "./auditLogService.js";

export async function applyPunishment(guildId, userId, type, duration, reason, amount = null) {
    const punishment = await prisma.punishment.create({
        data: { guildId, userId, type, duration, reason, active: true }
    });

    if (type === "influence_loss") {
        await prisma.user.update({
            where: { guildId_discordId: { guildId, discordId: userId } },
            data: { influencia: { decrement: amount || 10 } }
        });
    }

    if (type === "economy_fine") {
        await prisma.user.update({
            where: { guildId_discordId: { guildId, discordId: userId } },
            data: { dinheiro: { decrement: amount || 100 } }
        });
    }

    await logAudit({
        guildId,
        action: "punishment.apply",
        actorId: null,
        targetId: userId,
        source: "punishment",
        severity: "warn",
        meta: { type, duration, reason, amount }
    });

    return punishment;
}

export async function removePunishment(guildId, userId) {
    return prisma.punishment.updateMany({
        where: { guildId, userId, active: true },
        data: { active: false }
    });
}

async function isExpired(punishment) {
    if (!punishment.duration) return false;
    const expiresAt = new Date(punishment.createdAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + punishment.duration);
    return Date.now() > expiresAt.getTime();
}

export async function getActivePunishments(guildId, type) {
    const punishments = await prisma.punishment.findMany({
        where: { guildId, active: true, type }
    });
    const active = [];
    for (const punishment of punishments) {
        if (await isExpired(punishment)) {
            await prisma.punishment.update({
                where: { id: punishment.id },
                data: { active: false }
            });
        } else {
            active.push(punishment);
        }
    }
    return active;
}

export async function getBlockedUserIds(guildId, type) {
    const active = await getActivePunishments(guildId, type);
    return active.map((p) => p.userId);
}

export async function checkIfBlocked(guildId, userId) {
    const active = await prisma.punishment.findFirst({
        where: { guildId, userId, active: true, type: "xp_block" }
    });
    if (!active) return false;
    if (await isExpired(active)) {
        await removePunishment(guildId, userId);
        return false;
    }
    return true;
}
