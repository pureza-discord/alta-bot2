import { User } from "../models/User.js";
import { addWarPoints } from "./warService.js";
import { config } from "../config/index.js";
import { info } from "../utils/logger.js";
import { checkIfBlocked } from "./core/punishmentService.js";
import { registerTopXp } from "./hallOfFameService.js";
import { createMedal, awardMedal } from "./medalService.js";
import { getVipStatus } from "./core/vipService.js";

const MESSAGE_XP = 8;
const COOLDOWN_MS = 30 * 1000;
const cooldowns = new Map();

function getLevelXpRequirement(level) {
    return 150 * level * level + 500;
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

    const previous = await User.findOne({ userId, guildId });
    const vip = await getVipStatus(guildId, userId);
    const awardedXp = vip.active ? Math.ceil(MESSAGE_XP * 1.2) : MESSAGE_XP;
    const user = await User.findOneAndUpdate(
        { userId, guildId },
        {
            $inc: {
                xpTotal: awardedXp,
                weeklyXP: awardedXp,
                seasonalXP: awardedXp,
                totalMessages: 1
            },
            $set: { lastMessageAt: new Date(now) },
            $setOnInsert: { userId, guildId }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const levelResult = await checkLevelUp(user);

    if (user.districtId) {
        await addWarPoints(user.districtId, 1, "message");
    }

    await registerTopXp(userId, awardedXp);

    if (previous?.lastMessageAt) {
        const diff = now - new Date(previous.lastMessageAt).getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (diff >= oneDay && diff <= 2 * oneDay) {
            user.streakDays += 1;
        } else if (diff > 2 * oneDay) {
            user.streakDays = 1;
        }
        await user.save();
        if (user.streakDays >= 7) {
            const medal = await createMedal("7 dias streak", "🔥");
            await awardMedal(userId, guildId, medal.id);
        }
    }

    return { awarded: true, levelUp: levelResult.leveledUp, user };
}

export async function checkLevelUp(user) {
    const newLevel = calculateLevel(user.xpTotal);
    if (newLevel > user.level) {
        user.level = newLevel;
        await user.save();
        info(`Usuário ${user.userId} subiu para o nível ${newLevel}.`);
        return { leveledUp: true, level: newLevel };
    }
    return { leveledUp: false, level: user.level };
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
