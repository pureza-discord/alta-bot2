import { prisma } from "../prisma.js";
import { logger } from "../../utils/logger.js";
import { ensureContainers } from "../../systems/hierarchySystem.js";
import { logAudit } from "./auditLogService.js";

const TIER_REQUIREMENTS = {
    INICIANTE: { mensagens: 500, eventos: 2, recrutas: 1, guerras: 0 },
    MEDIANO: { mensagens: 1500, eventos: 5, recrutas: 3, guerras: 1 },
    "ACIMA DA MÉDIA": { mensagens: 3000, eventos: 8, recrutas: 5, guerras: 3 },
    SUPERIOR: { mensagens: 10000, eventos: 0, recrutas: 0, guerras: 0 }
};

const ROLE_BY_TIER = {
    INICIANTE: "Capanga",
    MEDIANO: "Linha de Frente",
    "ACIMA DA MÉDIA": "Chanceler",
    SUPERIOR: "Profano",
    POSSES: "Gods of Purity"
};

const TIER_BY_ROLE = {
    Capanga: "INICIANTE",
    Soldado: "INICIANTE",
    Sicário: "INICIANTE",
    "Linha de Frente": "MEDIANO",
    "Alto Escalão": "MEDIANO",
    "A Elite": "MEDIANO",
    Chanceler: "ACIMA DA MÉDIA",
    "Executor Chefe": "ACIMA DA MÉDIA",
    "Oráculo da Câmara": "ACIMA DA MÉDIA",
    Profano: "SUPERIOR",
    Intocável: "SUPERIOR",
    Mercenário: "SUPERIOR",
    "Gods of Purity": "POSSES"
};

const NEXT_TIER = {
    INICIANTE: "MEDIANO",
    MEDIANO: "ACIMA DA MÉDIA",
    "ACIMA DA MÉDIA": "SUPERIOR",
    SUPERIOR: "POSSES"
};

export function getProgressForTier(user) {
    const tier = TIER_BY_ROLE[user.nivel] || "INICIANTE";
    const req = TIER_REQUIREMENTS[tier];
    const next = NEXT_TIER[tier];
    return {
        tier,
        nextTier: next || null,
        requirements: req || null,
        current: {
            mensagens: user.mensagens,
            eventos: user.eventos,
            recrutas: user.recrutas,
            guerras: user.guerraPontos
        }
    };
}

export async function checkPromotion(guild, userId, guildId) {
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: userId } }
    });
    if (!user) return null;

    const tier = TIER_BY_ROLE[user.nivel] || "INICIANTE";
    const req = TIER_REQUIREMENTS[tier];
    if (!req) return null;

    const meets =
        user.mensagens >= req.mensagens &&
        user.eventos >= req.eventos &&
        user.recrutas >= req.recrutas &&
        user.guerraPontos >= req.guerras;

    if (!meets) return null;
    const next = NEXT_TIER[tier];
    if (!next) return null;

    await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId: userId } },
        data: { nivel: ROLE_BY_TIER[next] }
    });

    await applyRolePromotion(guild, userId, user.nivel, ROLE_BY_TIER[next]);
    await ensureContainers(guild);
    logger.info("promotion", { userId, from: tier, to: next });
    await logAudit({
        guildId,
        action: "promotion.auto",
        actorId: null,
        targetId: userId,
        source: "promotion",
        meta: { from: tier, to: next }
    });
    return next;
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
