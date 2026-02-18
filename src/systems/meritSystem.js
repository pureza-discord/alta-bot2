import { getOrCreateUser, MeritLog, UserProfile } from "../services/databaseService.js";
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

function getNextMeritRole(currentRoleName) {
    const idx = MERIT_ROLE_ORDER.findIndex((name) => name === currentRoleName);
    if (idx === -1 || idx === MERIT_ROLE_ORDER.length - 1) return null;
    return MERIT_ROLE_ORDER[idx + 1];
}
import { PromotionLog } from "../services/databaseService.js";
import { logMerit, logPromotion } from "../services/logService.js";
import { applyPromotion } from "../services/promotionService.js";

export async function addMerit(userId, guildId, amount, guild) {
    const user = await getOrCreateUser(userId, guildId);
    user.meritPoints += amount;
    const starsGained = Math.floor(user.meritPoints / 3);
    user.meritStars = Math.min(3, starsGained);

    await user.save();
    await MeritLog.create({
        userId,
        guildId,
        delta: amount,
        points: user.meritPoints,
        stars: user.meritStars
    });
    if (guild) {
        await logMerit(guild, { userId, delta: amount, points: user.meritPoints, stars: user.meritStars });
    }

    if (user.meritStars >= 3 && guild) {
        const currentRoleName = user.currentRank;
        const nextRole = getNextMeritRole(currentRoleName);
        if (nextRole) {
            await applyPromotion(guild, userId, currentRoleName, nextRole, "mérito");
            user.currentRank = nextRole;
            user.meritStars = 0;
            user.meritPoints = 0;
            await user.save();
            await PromotionLog.create({
                userId,
                guildId,
                fromRank: currentRoleName,
                toRank: nextRole,
                reason: "mérito"
            });
            await logPromotion(guild, {
                userId,
                fromRank: currentRoleName,
                toRank: nextRole,
                reason: "mérito"
            });
        }
    }
    return user;
}

export async function removeMerit(userId, guildId, amount, guild) {
    const user = await getOrCreateUser(userId, guildId);
    user.meritPoints = Math.max(0, user.meritPoints - amount);
    user.meritStars = Math.min(3, Math.floor(user.meritPoints / 3));
    await user.save();
    await MeritLog.create({
        userId,
        guildId,
        delta: -amount,
        points: user.meritPoints,
        stars: user.meritStars
    });
    if (guild) {
        await logMerit(guild, { userId, delta: -amount, points: user.meritPoints, stars: user.meritStars });
    }
    return user;
}
