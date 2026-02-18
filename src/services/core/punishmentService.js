import { prisma } from "../prisma.js";

export async function applyPunishment(guildId, userId, type, duration, reason) {
    return prisma.punishment.create({
        data: { guildId, userId, type, duration, reason, active: true }
    });
}

export async function removePunishment(guildId, userId) {
    return prisma.punishment.updateMany({
        where: { guildId, userId, active: true },
        data: { active: false }
    });
}

export async function checkIfBlocked(guildId, userId) {
    const active = await prisma.punishment.findFirst({
        where: { guildId, userId, active: true, type: "xp_block" }
    });
    if (!active) return false;
    if (active.duration) {
        const expiresAt = new Date(active.createdAt);
        expiresAt.setMinutes(expiresAt.getMinutes() + active.duration);
        if (Date.now() > expiresAt.getTime()) {
            await removePunishment(guildId, userId);
            return false;
        }
    }
    return true;
}
