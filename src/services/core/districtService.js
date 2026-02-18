import { prisma } from "../prisma.js";

export async function createDistrict(guildId, nome, capitaoId) {
    return prisma.distrito.create({
        data: {
            guildId,
            nome,
            capitaoId
        }
    });
}

export async function setCaptain(guildId, distritoId, capitaoId) {
    return prisma.distrito.update({
        where: { id: distritoId },
        data: { capitaoId }
    });
}

export async function setCommander(guildId, distritoId, slot, commanderId) {
    const data =
        slot === 1 ? { comandante1Id: commanderId } : { comandante2Id: commanderId };
    return prisma.distrito.update({ where: { id: distritoId }, data });
}

export async function setCounselor(guildId, distritoId, conselheiroId) {
    return prisma.distrito.update({
        where: { id: distritoId },
        data: { conselheiroId }
    });
}

export async function getDistrictRanking(guildId) {
    return prisma.distrito.findMany({
        where: { guildId },
        orderBy: { pontos: "desc" }
    });
}

export async function addDistrictPoints(guildId, distritoId, amount) {
    return prisma.distrito.update({
        where: { id: distritoId },
        data: { pontos: { increment: amount } }
    });
}

export async function findDistrictByName(guildId, nome) {
    return prisma.distrito.findFirst({
        where: { guildId, nome: { equals: nome, mode: "insensitive" } }
    });
}
