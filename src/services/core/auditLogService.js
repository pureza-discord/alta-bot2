import { prisma } from "../prisma.js";

export async function logAudit({
    guildId,
    action,
    actorId = null,
    targetId = null,
    source = null,
    severity = "info",
    meta = null
}) {
    try {
        return await prisma.auditLog.create({
            data: {
                guildId,
                action,
                actorId,
                targetId,
                source,
                severity,
                meta
            }
        });
    } catch (error) {
        console.error("Erro ao salvar audit log:", error);
        return null;
    }
}

export async function getAuditLogs(guildId, { action, actorId, targetId, limit = 50 } = {}) {
    return prisma.auditLog.findMany({
        where: {
            guildId,
            action: action || undefined,
            actorId: actorId || undefined,
            targetId: targetId || undefined
        },
        orderBy: { createdAt: "desc" },
        take: limit
    });
}
