import { prisma } from "../services/prisma.js";

export async function getRanking(req, res) {
    const guildId = req.query.guildId;
    const ranking = await prisma.user.findMany({
        where: { guildId },
        orderBy: { mensagens: "desc" },
        take: 50
    });
    res.json({ ranking });
}

export async function getDistricts(req, res) {
    const guildId = req.query.guildId;
    const districts = await prisma.distrito.findMany({
        where: { guildId },
        orderBy: { pontos: "desc" }
    });
    res.json({ districts });
}

export async function getSeason(req, res) {
    const guildId = req.query.guildId;
    const season = await prisma.temporada.findFirst({
        where: { guildId, ativa: true }
    });
    res.json({ season });
}

export async function getUser(req, res) {
    const { id } = req.params;
    const guildId = req.query.guildId;
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: id } }
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ user });
}
