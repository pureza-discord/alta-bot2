import { prisma } from "../prisma.js";
import { createSeasonDistrictMissions } from "./missionService.js";

export async function startSeason(guildId) {
    const last = await prisma.temporada.findFirst({
        where: { guildId },
        orderBy: { numero: "desc" }
    });
    const number = last ? last.numero + 1 : 1;
    await prisma.temporada.updateMany({ where: { guildId, ativa: true }, data: { ativa: false } });
    const season = await prisma.temporada.create({
        data: { guildId, numero: number, ativa: true, startedAt: new Date() }
    });
    await createSeasonDistrictMissions(guildId, season.id);
    return season;
}

export async function endSeason(guildId) {
    const season = await prisma.temporada.findFirst({ where: { guildId, ativa: true } });
    if (!season) {
        throw new Error("Nenhuma temporada ativa.");
    }
    await prisma.temporada.update({
        where: { id: season.id },
        data: { ativa: false, endedAt: new Date() }
    });
    const topUser = await prisma.user.findFirst({
        where: { guildId },
        orderBy: { mensagens: "desc" }
    });
    if (topUser) {
        const medal = await prisma.medalha.upsert({
            where: { nome: "Campeão da Temporada" },
            update: {},
            create: { nome: "Campeão da Temporada", descricao: "Top ranking da temporada", permanente: true }
        });
        await prisma.userMedalha.upsert({
            where: {
                userId_medalhaId_guildId: {
                    userId: topUser.id,
                    medalhaId: medal.id,
                    guildId
                }
            },
            update: {},
            create: { userId: topUser.id, medalhaId: medal.id, guildId }
        });
    }
    await prisma.user.updateMany({
        where: { guildId },
        data: { mensagens: 0, eventos: 0, guerraPontos: 0 }
    });
    return season;
}
