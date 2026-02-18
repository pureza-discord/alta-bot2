import { prisma } from "../prisma.js";
import { logAudit } from "./auditLogService.js";

const MIN_INFLUENCE_TO_PROPOSE = 50;
const VOTE_WEIGHT_DIVISOR = 10;

function getVoteWeight(influencia) {
    return Math.max(1, Math.floor(influencia / VOTE_WEIGHT_DIVISOR));
}

export async function addInfluence(guildId, discordId, amount) {
    const user = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { influencia: { increment: amount } }
    });
    await logAudit({
        guildId,
        action: "influence.add",
        actorId: null,
        targetId: discordId,
        source: "influence",
        meta: { amount }
    });
    return user;
}

export async function removeInfluence(guildId, discordId, amount) {
    const user = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { influencia: { decrement: amount } }
    });
    await logAudit({
        guildId,
        action: "influence.remove",
        actorId: null,
        targetId: discordId,
        source: "influence",
        meta: { amount }
    });
    return user;
}

export async function getTopInfluence(guildId, limit = 10) {
    return prisma.user.findMany({
        where: { guildId },
        orderBy: { influencia: "desc" },
        take: limit
    });
}

export async function createProposal(guildId, createdBy, titulo, descricao) {
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: createdBy } }
    });
    if (!user || user.influencia < MIN_INFLUENCE_TO_PROPOSE) {
        throw new Error("Influência insuficiente para criar proposta.");
    }
    const proposal = await prisma.proposta.create({
        data: { guildId, createdBy, titulo, descricao }
    });
    await logAudit({
        guildId,
        action: "proposal.create",
        actorId: createdBy,
        targetId: proposal.id,
        source: "influence",
        meta: { titulo }
    });
    return proposal;
}

export async function voteProposal(guildId, proposalId, voterId, vote) {
    const proposal = await prisma.proposta.findFirst({
        where: { id: proposalId, guildId, status: "open" }
    });
    if (!proposal) {
        throw new Error("Proposta não encontrada.");
    }
    if (proposal.votantes.includes(voterId)) {
        throw new Error("Você já votou.");
    }
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: voterId } }
    });
    const weight = getVoteWeight(user?.influencia || 0);
    const updated = await prisma.proposta.update({
        where: { id: proposalId },
        data: {
            votosSim: { increment: vote === "sim" ? weight : 0 },
            votosNao: { increment: vote === "nao" ? weight : 0 },
            votantes: { push: voterId }
        }
    });
    await logAudit({
        guildId,
        action: "proposal.vote",
        actorId: voterId,
        targetId: proposalId,
        source: "influence",
        meta: { vote, weight }
    });
    return updated;
}

export async function closeProposal(guildId, proposalId) {
    const proposal = await prisma.proposta.update({
        where: { id: proposalId },
        data: { status: "closed" }
    });
    const approved = proposal.votosSim > proposal.votosNao;
    await logAudit({
        guildId,
        action: "proposal.close",
        actorId: null,
        targetId: proposalId,
        source: "influence",
        meta: { approved, votosSim: proposal.votosSim, votosNao: proposal.votosNao }
    });
    return { proposal, approved };
}

export async function listProposals(guildId, status = "open") {
    return prisma.proposta.findMany({
        where: { guildId, status },
        orderBy: { createdAt: "desc" }
    });
}
