import { prisma } from "../prisma.js";
import { logAudit } from "./auditLogService.js";

const VIP_ROLE_NAME = "VIP";
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function setCache(guildId, userId, value) {
    cache.set(cacheKey(guildId, userId), { ...value, checkedAt: Date.now() });
}

function getCache(guildId, userId) {
    const entry = cache.get(cacheKey(guildId, userId));
    if (!entry) return null;
    if (Date.now() - entry.checkedAt > CACHE_TTL_MS) {
        cache.delete(cacheKey(guildId, userId));
        return null;
    }
    return entry;
}

export async function getVipStatus(guildId, userId) {
    const cached = getCache(guildId, userId);
    if (cached) return cached;
    const vip = await prisma.vipAccess.findUnique({
        where: { guildId_userId: { guildId, userId } }
    });
    const active = Boolean(vip && vip.active && vip.expiresAt > new Date());
    const status = { active, expiresAt: vip?.expiresAt || null, type: vip?.type || null };
    setCache(guildId, userId, status);
    return status;
}

export async function grantVip(guild, guildId, userId, days, type = "VIP") {
    const now = new Date();
    const existing = await prisma.vipAccess.findUnique({
        where: { guildId_userId: { guildId, userId } }
    });
    const base = existing && existing.expiresAt > now ? existing.expiresAt : now;
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    const vip = await prisma.vipAccess.upsert({
        where: { guildId_userId: { guildId, userId } },
        update: { expiresAt, active: true, type },
        create: { guildId, userId, expiresAt, active: true, type }
    });
    await applyVipRole(guild, userId, true);
    setCache(guildId, userId, { active: true, expiresAt, type });
    await logAudit({
        guildId,
        action: "vip.grant",
        actorId: null,
        targetId: userId,
        source: "vip",
        meta: { days, type, expiresAt }
    });
    return vip;
}

export async function revokeVip(guild, guildId, userId, reason = "manual") {
    const vip = await prisma.vipAccess.upsert({
        where: { guildId_userId: { guildId, userId } },
        update: { active: false },
        create: { guildId, userId, expiresAt: new Date(), active: false }
    });
    await applyVipRole(guild, userId, false);
    setCache(guildId, userId, { active: false, expiresAt: vip.expiresAt, type: vip.type || null });
    await logAudit({
        guildId,
        action: "vip.revoke",
        actorId: null,
        targetId: userId,
        source: "vip",
        meta: { reason }
    });
    return vip;
}

export async function expireVipForGuild(guild) {
    const guildId = guild.id;
    const now = new Date();
    const expired = await prisma.vipAccess.findMany({
        where: { guildId, active: true, expiresAt: { lt: now } }
    });
    for (const vip of expired) {
        await prisma.vipAccess.update({
            where: { id: vip.id },
            data: { active: false }
        });
        await applyVipRole(guild, vip.userId, false);
        setCache(guildId, vip.userId, { active: false, expiresAt: vip.expiresAt, type: vip.type || null });
        await logAudit({
            guildId,
            action: "vip.expire",
            actorId: null,
            targetId: vip.userId,
            source: "vip",
            meta: { expiresAt: vip.expiresAt }
        });
    }
    return expired.length;
}

async function applyVipRole(guild, userId, shouldHave) {
    if (!guild) return;
    const role = guild.roles.cache.find((r) => r.name === VIP_ROLE_NAME);
    if (!role) return;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    if (shouldHave && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
    }
    if (!shouldHave && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
    }
}
