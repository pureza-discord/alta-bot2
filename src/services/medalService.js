import { prisma } from "./prisma.js";

export async function createMedal(name, icon = "🏅") {
    return prisma.medalha.upsert({
        where: { nome: name },
        update: {},
        create: { nome: name, descricao: icon, permanente: true }
    });
}

export async function awardMedal(userId, guildId, medalId) {
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: userId } }
    });
    if (!user) {
        return null;
    }
    return prisma.userMedalha.upsert({
        where: {
            userId_medalhaId_guildId: {
                userId: user.id,
                medalhaId: medalId,
                guildId
            }
        },
        update: {},
        create: { userId: user.id, medalhaId: medalId, guildId }
    });
}

export async function removeMedal(userId, guildId, medalId) {
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: userId } }
    });
    if (!user) return null;
    return prisma.userMedalha.delete({
        where: {
            userId_medalhaId_guildId: {
                userId: user.id,
                medalhaId,
                guildId
            }
        }
    });
}
