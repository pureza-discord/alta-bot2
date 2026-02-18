import { prisma } from "./prisma.js";
import { addWarPoints } from "./core/warService.js";
import { config } from "../config/index.js";
import { info } from "../utils/logger.js";
import { checkIfBlocked } from "./core/punishmentService.js";
import { createMedal, awardMedal } from "./medalService.js";
import { getVipStatus } from "./core/vipService.js";

const MESSAGE_XP = 8;
const COOLDOWN_MS = 30 * 1000;
const cooldowns = new Map();
const MAX_LEVEL_FOR_BONUS = 50;
const LEVEL_XP_BONUS = 0.03;
const VOICE_XP_PER_MINUTE = 2;

function getLevelXpRequirement(level) {
    const rawFormula = config.xpFormula || "150 * level * level + 500";
    const formula = rawFormula.replace(/\^/g, "**");
    try {
        // eslint-disable-next-line no-new-func
        return Function("level", `return ${formula}`)(level);
    } catch {
        return 150 * level * level + 500;
    }
}

export function calculateLevel(xpTotal) {
    let level = 0;
    while (xpTotal >= getLevelXpRequirement(level + 1)) {
        level += 1;
    }
    return level;
}

export async function addMessageXP(userId, guildId) {
    const blocked = await checkIfBlocked(guildId, userId);
    if (blocked) {
        return { awarded: false, reason: "blocked" };
    }
    const key = `${guildId}:${userId}`;
    const now = Date.now();

    if (cooldowns.has(key) && now - cooldowns.get(key) < COOLDOWN_MS) {
        return { awarded: false, reason: "cooldown" };
    }

    cooldowns.set(key, now);

    const previous = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: userId } }
    });
    const vip = await getVipStatus(guildId, userId);
    const currentLevel = previous?.level || 0;
    const bonusLevel = Math.min(currentLevel, MAX_LEVEL_FOR_BONUS);
    const baseXp = MESSAGE_XP * (1 + bonusLevel * LEVEL_XP_BONUS);
    const awardedXp = vip.active ? Math.ceil(baseXp * 1.2) : Math.ceil(baseXp);
    const user = await prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId: userId } },
        update: {
            xpTotal: { increment: awardedXp },
            weeklyXP: { increment: awardedXp },
            seasonalXP: { increment: awardedXp },
            mensagens: { increment: 1 },
            lastMessageAt: new Date(now)
        },
        create: {
            guildId,
            discordId: userId,
            username: "unknown",
            xpTotal: awardedXp,
            weeklyXP: awardedXp,
            seasonalXP: awardedXp,
            mensagens: 1,
            lastMessageAt: new Date(now)
        }
    });

    const levelResult = await checkLevelUp(user);

    if (user.distritoId) {
        await addWarPoints(guildId, user.distritoId, 1);
    }

    if (previous?.lastMessageAt) {
        const diff = now - new Date(previous.lastMessageAt).getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        let streakDays = user.streakDays;
        if (diff >= oneDay && diff <= 2 * oneDay) {
            streakDays += 1;
        } else if (diff > 2 * oneDay) {
            streakDays = 1;
        }
        if (streakDays !== user.streakDays) {
            await prisma.user.update({
                where: { id: user.id },
                data: { streakDays }
            });
        }
        if (streakDays >= 7) {
            const medal = await createMedal("7 dias streak", "🔥");
            await awardMedal(userId, guildId, medal.id);
        }
    }

    return { awarded: true, levelUp: levelResult.leveledUp, user };
}

export async function addEventXP(userId, guildId, baseXp = 50) {
    const blocked = await checkIfBlocked(guildId, userId);
    if (blocked) {
        return { awarded: false, reason: "blocked" };
    }

    const current = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: userId } }
    });
    const currentLevel = current?.level || 0;
    const bonusLevel = Math.min(currentLevel, MAX_LEVEL_FOR_BONUS);
    const baseAward = baseXp * (1 + bonusLevel * LEVEL_XP_BONUS);

    const vip = await getVipStatus(guildId, userId);
    const awardedXp = vip.active ? Math.ceil(baseAward * 1.2) : Math.ceil(baseAward);

    const user = await prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId: userId } },
        update: {
            xpTotal: { increment: awardedXp },
            weeklyXP: { increment: awardedXp },
            seasonalXP: { increment: awardedXp }
        },
        create: {
            guildId,
            discordId: userId,
            username: "unknown",
            xpTotal: awardedXp,
            weeklyXP: awardedXp,
            seasonalXP: awardedXp
        }
    });

    const levelResult = await checkLevelUp(user);
    return { awarded: true, levelUp: levelResult.leveledUp, user, awardedXp };
}

export async function checkLevelUp(user) {
    const newLevel = calculateLevel(user.xpTotal);
    if (newLevel > user.level) {
        await prisma.user.update({
            where: { id: user.id },
            data: { level: newLevel }
        });
        info(`Usuário ${user.discordId} subiu para o nível ${newLevel}.`);
        return { leveledUp: true, level: newLevel };
    }
    return { leveledUp: false, level: user.level };
}

export async function addVoiceXP(userId, guildId, secondsInCall) {
    const blocked = await checkIfBlocked(guildId, userId);
    if (blocked) {
        return { awarded: false, reason: "blocked" };
    }

    const minutes = Math.floor(secondsInCall / 60);
    if (minutes <= 0) {
        return { awarded: false, reason: "too_short" };
    }

    const current = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: userId } }
    });
    const currentLevel = current?.level || 0;
    const bonusLevel = Math.min(currentLevel, MAX_LEVEL_FOR_BONUS);
    const baseXp = VOICE_XP_PER_MINUTE * minutes * (1 + bonusLevel * LEVEL_XP_BONUS);

    const vip = await getVipStatus(guildId, userId);
    const awardedXp = vip.active ? Math.ceil(baseXp * 1.2) : Math.ceil(baseXp);

    const user = await prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId: userId } },
        update: {
            xpTotal: { increment: awardedXp },
            weeklyXP: { increment: awardedXp },
            seasonalXP: { increment: awardedXp }
        },
        create: {
            guildId,
            discordId: userId,
            username: "unknown",
            xpTotal: awardedXp,
            weeklyXP: awardedXp,
            seasonalXP: awardedXp
        }
    });

    const levelResult = await checkLevelUp(user);
    return { awarded: true, levelUp: levelResult.leveledUp, user, minutes, awardedXp };
}

export async function updateHierarchy(member, level) {
    const hierarchyRoles = config.hierarchyRoles;
    if (!Array.isArray(hierarchyRoles) || hierarchyRoles.length === 0) {
        return { updated: false, reason: "no_roles_configured" };
    }

    const sorted = [...hierarchyRoles].sort((a, b) => a.level - b.level);
    const target = sorted.filter((entry) => level >= entry.level).pop();

    if (!target) {
        return { updated: false, reason: "no_matching_role" };
    }

    const roleIds = sorted.map((entry) => entry.roleId);
    const rolesToRemove = member.roles.cache.filter((role) => roleIds.includes(role.id));
    if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove);
    }

    if (!member.roles.cache.has(target.roleId)) {
        await member.roles.add(target.roleId);
    }

    return { updated: true, roleId: target.roleId };
}
