import { prisma } from "../prisma.js";
import { addRecruit, getUser } from "./userService.js";
import { addWarPoints } from "./warService.js";
import { checkPromotion } from "./promotionService.js";
import { logger } from "../../utils/logger.js";
import { logAudit } from "./auditLogService.js";
import { addDistrictMissionProgress } from "./missionService.js";
import { addContractProgress } from "./contractService.js";

const MIN_MESSAGES = 50;

export async function registerRecruit(guildId, indicadorId, novoMembroId, distritoId, guild = null) {
    const novo = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId: novoMembroId } }
    });
    if (!novo || novo.mensagens < MIN_MESSAGES) {
        throw new Error("Novo membro precisa de 50 mensagens para validar.");
    }

    const recruitment = await prisma.recrutamento.create({
        data: { guildId, indicadorId, novoMembroId, validado: true }
    });
    logger.info("recruitment", { guildId, indicadorId, novoMembroId });
    await logAudit({
        guildId,
        action: "recruitment.register",
        actorId: indicadorId,
        targetId: novoMembroId,
        source: "recruitment",
        meta: { distritoId }
    });

    await addRecruit(guildId, indicadorId, 1);
    if (distritoId) {
        await addWarPoints(guildId, distritoId, 5);
        await addDistrictMissionProgress(guildId, distritoId, "season_recruits", 1);
        await addContractProgress(guildId, distritoId, { recrutas: 1 });
    }
    if (guild) {
        await checkPromotion(guild, indicadorId, guildId);
    }
    return recruitment;
}
