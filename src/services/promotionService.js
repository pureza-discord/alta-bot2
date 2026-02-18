import { getOrCreateUser, PromotionLog, UserProfile } from "./databaseService.js";
import { logPromotion } from "./logService.js";

const TIER_REQUIREMENTS = {
    INICIANTE: { messages: 500, events: 2, recruits: 1, war: 0 },
    MEDIANO: { messages: 1500, events: 5, recruits: 3, war: 1 },
    "ACIMA DA MÉDIA": { messages: 3000, events: 8, recruits: 5, war: 3 },
    SUPERIOR: { messages: 10000, events: 0, recruits: 0, war: 0 }
};

const TIER_TRANSITION = {
    INICIANTE: { nextTier: "MEDIANO", nextRole: "Linha de Frente" },
    MEDIANO: { nextTier: "ACIMA DA MÉDIA", nextRole: "Chanceler" },
    "ACIMA DA MÉDIA": { nextTier: "SUPERIOR", nextRole: "Profano" },
    SUPERIOR: { nextTier: "POSSES PRZ", nextRole: "Gods of Purity" }
};

const ROLE_TIER_MAP = {
    "Sicário": "INICIANTE",
    "Soldado": "INICIANTE",
    "Capanga": "INICIANTE",
    "Linha de Frente": "MEDIANO",
    "Alto Escalão": "MEDIANO",
    "A Elite": "MEDIANO",
    "Chanceler": "ACIMA DA MÉDIA",
    "Executor Chefe": "ACIMA DA MÉDIA",
    "Oráculo da Câmara": "ACIMA DA MÉDIA",
    "Profano": "SUPERIOR",
    "Intocável": "SUPERIOR",
    "Mercenário": "SUPERIOR",
    "Gods of Purity": "POSSES PRZ"
};

export async function applyPromotion(guild, userId, fromRoleName, toRoleName, reason) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return false;

    const fromRole = guild.roles.cache.find((role) => role.name === fromRoleName);
    const toRole = guild.roles.cache.find((role) => role.name === toRoleName);
    if (!toRole) return false;

    if (fromRole && member.roles.cache.has(fromRole.id)) {
        await member.roles.remove(fromRole);
    }
    await member.roles.add(toRole);

    await PromotionLog.create({
        userId,
        guildId: guild.id,
        fromRank: fromRoleName,
        toRank: toRoleName,
        reason
    });
    await logPromotion(guild, { userId, fromRank: fromRoleName, toRank: toRoleName, reason });
    return true;
}

export async function checkAutoPromotion(userId, guildId, guild) {
    const user = await getOrCreateUser(userId, guildId);
    const currentRole = user.currentRank || "Capanga";
    const currentTier = ROLE_TIER_MAP[currentRole] || "INICIANTE";
    const requirements = TIER_REQUIREMENTS[currentTier];
    if (!requirements) return null;

    const meetsRequirements =
        user.messages >= requirements.messages &&
        user.events >= requirements.events &&
        user.recruits >= requirements.recruits &&
        user.warParticipations >= requirements.war;

    if (!meetsRequirements) return null;

    const transition = TIER_TRANSITION[currentTier];
    if (!transition) return null;

    user.currentRank = transition.nextRole;
    await user.save();

    if (guild) {
        await applyPromotion(guild, userId, currentRole, transition.nextRole, "metas");
    }
    return transition.nextRole;
}
