import { prisma } from "../prisma.js";

const REPLY_WEIGHT = 2;
const THREAD_WEIGHT = 3;

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export async function trackMessage({ guildId, userId, categoryId, districtId, isReply, hasThread }) {
    const now = new Date();
    const day = startOfDay(now);
    const hour = now.getHours();
    const engagementScore = 1 + (isReply ? REPLY_WEIGHT : 0) + (hasThread ? THREAD_WEIGHT : 0);

    return prisma.messageMetric.upsert({
        where: {
            guildId_userId_categoryId_day_hour: {
                guildId,
                userId,
                categoryId: categoryId || null,
                day,
                hour
            }
        },
        update: {
            messages: { increment: 1 },
            replies: { increment: isReply ? 1 : 0 },
            threads: { increment: hasThread ? 1 : 0 },
            engagementScore: { increment: engagementScore }
        },
        create: {
            guildId,
            userId,
            districtId: districtId || null,
            categoryId: categoryId || null,
            day,
            hour,
            messages: 1,
            replies: isReply ? 1 : 0,
            threads: hasThread ? 1 : 0,
            engagementScore
        }
    });
}

export async function getHeatmap(guildId, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await prisma.$queryRaw`
        SELECT hour, SUM(messages) AS total
        FROM "MessageMetric"
        WHERE "guildId" = ${guildId} AND "day" >= ${since}
        GROUP BY hour
        ORDER BY hour ASC
    `;
    return rows;
}

export async function getEngagementRanking(guildId, days = 7, limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await prisma.$queryRaw`
        SELECT "userId", SUM("engagementScore") AS score
        FROM "MessageMetric"
        WHERE "guildId" = ${guildId} AND "day" >= ${since}
        GROUP BY "userId"
        ORDER BY score DESC
        LIMIT ${limit}
    `;
    return rows;
}

export async function getCategoryMetrics(guildId, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await prisma.$queryRaw`
        SELECT "categoryId", SUM("messages") AS total
        FROM "MessageMetric"
        WHERE "guildId" = ${guildId} AND "day" >= ${since}
        GROUP BY "categoryId"
        ORDER BY total DESC
    `;
    return rows;
}

export async function getDistrictMetrics(guildId, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await prisma.$queryRaw`
        SELECT "districtId", SUM("messages") AS total
        FROM "MessageMetric"
        WHERE "guildId" = ${guildId} AND "day" >= ${since}
        GROUP BY "districtId"
        ORDER BY total DESC
    `;
    return rows;
}
