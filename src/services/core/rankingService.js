import { prisma } from "../prisma.js";

export async function getDistrictRankingByPoints(guildId, limit = 10) {
    return prisma.distrito.findMany({
        where: { guildId },
        orderBy: { pontos: "desc" },
        take: limit
    });
}

export async function getTopMessages(guildId, limit = 10) {
    return prisma.user.findMany({
        where: { guildId },
        orderBy: { mensagens: "desc" },
        take: limit
    });
}

export async function getTopInfluence(guildId, limit = 10) {
    return prisma.user.findMany({
        where: { guildId },
        orderBy: { influencia: "desc" },
        take: limit
    });
}

export async function getTopRecruits(guildId, limit = 10) {
    return prisma.user.findMany({
        where: { guildId },
        orderBy: { recrutas: "desc" },
        take: limit
    });
}

export async function getTopEvents(guildId, limit = 10) {
    return prisma.user.findMany({
        where: { guildId },
        orderBy: { eventos: "desc" },
        take: limit
    });
}

export async function getGlobalUserRanking(metric = "mensagens", limit = 10) {
    const allowed = ["mensagens", "influencia", "recrutas", "eventos"];
    const field = allowed.includes(metric) ? metric : "mensagens";
    const rows = await prisma.$queryRawUnsafe(
        `SELECT "discordId", SUM("${field}") AS total
         FROM "User"
         GROUP BY "discordId"
         ORDER BY total DESC
         LIMIT $1`,
        limit
    );
    return rows;
}
