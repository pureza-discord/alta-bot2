import { prisma } from "../prisma.js";
import { addDistrictPoints } from "./districtService.js";
import { logAudit } from "./auditLogService.js";

export async function createContract(guildId, distritoId, descricao, metaMensagens, metaRecrutas, recompensa, prazo) {
    const contract = await prisma.contrato.create({
        data: {
            guildId,
            distritoId: distritoId || null,
            descricao,
            metaMensagens,
            metaRecrutas,
            recompensa,
            prazo: prazo ? new Date(prazo) : null,
            ativo: true
        }
    });
    await logAudit({
        guildId,
        action: "contract.create",
        actorId: null,
        targetId: distritoId || null,
        source: "contract",
        meta: { contractId: contract.id }
    });
    return contract;
}

export async function addContractProgress(guildId, distritoId, { mensagens = 0, recrutas = 0 } = {}) {
    if (!distritoId) return [];
    const contracts = await prisma.contrato.findMany({
        where: { guildId, distritoId, ativo: true }
    });
    const completed = [];
    for (const contract of contracts) {
        const updated = await prisma.contrato.update({
            where: { id: contract.id },
            data: {
                progressoMensagens: { increment: mensagens },
                progressoRecrutas: { increment: recrutas }
            }
        });
        if (
            updated.progressoMensagens >= updated.metaMensagens &&
            updated.progressoRecrutas >= updated.metaRecrutas
        ) {
            await prisma.contrato.update({
                where: { id: updated.id },
                data: { ativo: false }
            });
            await addDistrictPoints(guildId, distritoId, updated.recompensa);
            await logAudit({
                guildId,
                action: "contract.complete",
                actorId: null,
                targetId: distritoId,
                source: "contract",
                meta: { contractId: updated.id, recompensa: updated.recompensa }
            });
            completed.push(updated);
        }
    }
    return completed;
}

export async function getActiveContracts(guildId, distritoId) {
    return prisma.contrato.findMany({
        where: { guildId, distritoId: distritoId || undefined, ativo: true }
    });
}
