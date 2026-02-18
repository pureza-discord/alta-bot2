import { prisma } from "../prisma.js";
import { logger } from "../../utils/logger.js";
import { ensureContainers } from "../../systems/hierarchySystem.js";
import { logAudit } from "./auditLogService.js";

const MERIT_ROLE_ORDER = [
    "Capanga",
    "Soldado",
    "Sicário",
    "Linha de Frente",
    "Alto Escalão",
    "A Elite",
    "Chanceler",
    "Executor Chefe",
    "Oráculo da Câmara",
    "Profano",
    "Intocável",
    "Mercenário",
    "Gods of Purity"
];

function nextRole(roleName) {
    const idx = MERIT_ROLE_ORDER.findIndex((role) => role === roleName);
    if (idx === -1 || idx === MERIT_ROLE_ORDER.length - 1) return null;
    return MERIT_ROLE_ORDER[idx + 1];
}

export async function addMerit(guild, guildId, discordId, amount) {
    const user = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { meritPoints: { increment: amount } }
    });
    const stars = Math.floor(user.meritPoints / 3);
    const updated = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { meritStars: Math.min(3, stars) }
    });
    logger.info("merit_add", { guildId, discordId, amount, stars: updated.meritStars });
    await logAudit({
        guildId,
        action: "merit.add",
        actorId: null,
        targetId: discordId,
        source: "merit",
        meta: { amount, stars: updated.meritStars }
    });

    if (updated.meritStars >= 3) {
        const roleTo = nextRole(updated.nivel);
        if (roleTo) {
            await applyRolePromotion(guild, discordId, updated.nivel, roleTo);
            await prisma.user.update({
                where: { guildId_discordId: { guildId, discordId } },
                data: { nivel: roleTo, meritStars: 0, meritPoints: 0 }
            });
            logger.info("merit_promotion", { discordId, roleTo });
            await logAudit({
                guildId,
                action: "merit.promotion",
                actorId: null,
                targetId: discordId,
                source: "merit",
                meta: { roleTo }
            });
            await ensureContainers(guild);
        }
    }
    return updated;
}

export async function removeMerit(guildId, discordId, amount) {
    const user = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { meritPoints: { decrement: amount } }
    });
    const stars = Math.floor(Math.max(0, user.meritPoints) / 3);
    const updated = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { meritStars: Math.min(3, stars) }
    });
    await logAudit({
        guildId,
        action: "merit.remove",
        actorId: null,
        targetId: discordId,
        source: "merit",
        meta: { amount, stars: updated.meritStars }
    });
    return updated;
}

async function applyRolePromotion(guild, userId, fromRoleName, toRoleName) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    const fromRole = guild.roles.cache.find((role) => role.name === fromRoleName);
    const toRole = guild.roles.cache.find((role) => role.name === toRoleName);
    if (fromRole && member.roles.cache.has(fromRole.id)) {
        await member.roles.remove(fromRole);
    }
    if (toRole) {
        await member.roles.add(toRole);
    }
}
