import { prisma } from "../prisma.js";

export async function getOrCreateUser(guildId, discordId, payload = {}) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: {},
        create: {
            guildId,
            discordId,
            username: payload.username || "unknown",
            avatar: payload.avatar || null
        }
    });
}

export async function getUser(guildId, discordId) {
    return prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId } }
    });
}

export async function updateUserStats(guildId, discordId, data) {
    return prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data
    });
}

export async function addMessages(guildId, discordId, amount = 1) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { mensagens: { increment: amount }, dinheiro: { increment: 1 } },
        create: { guildId, discordId, username: "unknown", mensagens: amount, dinheiro: 1 }
    });
}

export async function addEventParticipation(guildId, discordId, amount = 1) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { eventos: { increment: amount }, dinheiro: { increment: 5 } },
        create: { guildId, discordId, username: "unknown", eventos: amount, dinheiro: 5 }
    });
}

export async function addRecruit(guildId, discordId, amount = 1) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { recrutas: { increment: amount }, dinheiro: { increment: 10 } },
        create: { guildId, discordId, username: "unknown", recrutas: amount, dinheiro: 10 }
    });
}

export async function addWarPoints(guildId, discordId, amount = 1) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { guerraPontos: { increment: amount } },
        create: { guildId, discordId, username: "unknown", guerraPontos: amount }
    });
}

export async function addMerit(guildId, discordId, amount = 1) {
    const user = await prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { meritPoints: { increment: amount } },
        create: { guildId, discordId, username: "unknown", meritPoints: amount }
    });
    const stars = Math.floor(user.meritPoints / 3);
    return prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { meritStars: Math.min(3, stars) }
    });
}

export async function addInfluence(guildId, discordId, amount = 1) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { influencia: { increment: amount } },
        create: { guildId, discordId, username: "unknown", influencia: amount }
    });
}

export async function addMoney(guildId, discordId, amount = 1) {
    return prisma.user.upsert({
        where: { guildId_discordId: { guildId, discordId } },
        update: { dinheiro: { increment: amount } },
        create: { guildId, discordId, username: "unknown", dinheiro: amount }
    });
}

export async function setDistrict(guildId, discordId, distritoId) {
    return prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { distritoId }
    });
}
