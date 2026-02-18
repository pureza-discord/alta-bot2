import { War } from "../models/War.js";
import { District } from "../models/District.js";
import { config } from "../config/index.js";
import { info } from "../utils/logger.js";
import { registerDistrictWin, registerTopCaptain } from "./hallOfFameService.js";
import { createMedal, awardMedal } from "./medalService.js";

const DEFAULT_DURATION_DAYS = 7;

export async function challengeDistrict(challengerId, targetId, actorUserId) {
    const challenger = await District.findById(challengerId);
    if (!challenger) {
        throw new Error("Distrito desafiante não encontrado.");
    }
    if (actorUserId && challenger.captainId !== actorUserId) {
        throw new Error("Apenas o Capitão pode desafiar outro distrito.");
    }

    const existing = await War.findOne({
        status: { $in: ["pending", "active"] },
        $or: [
            { challengerDistrictId: challengerId },
            { targetDistrictId: challengerId },
            { challengerDistrictId: targetId },
            { targetDistrictId: targetId }
        ]
    });
    if (existing) {
        throw new Error("Já existe uma guerra pendente ou ativa para um desses distritos.");
    }

    const war = await War.create({
        challengerDistrictId: challengerId,
        targetDistrictId: targetId,
        status: "pending"
    });

    info(`Guerra pendente criada entre ${challengerId} e ${targetId}.`);
    return war;
}

export async function acceptChallenge(warId, actorUserId, durationDays = DEFAULT_DURATION_DAYS) {
    const war = await War.findById(warId);
    if (!war) {
        throw new Error("Guerra não encontrada.");
    }
    if (war.status !== "pending") {
        throw new Error("Guerra não está pendente.");
    }
    const target = await District.findById(war.targetDistrictId);
    if (!target) {
        throw new Error("Distrito alvo não encontrado.");
    }
    if (actorUserId && target.captainId !== actorUserId) {
        throw new Error("Apenas o Capitão do distrito alvo pode aceitar.");
    }
    const createdAt = war.createdAt || new Date();
    const expiration = new Date(createdAt);
    expiration.setHours(expiration.getHours() + 24);
    if (Date.now() > expiration.getTime()) {
        throw new Error("Desafio expirado.");
    }
    const duration = Number(config.warDuration || durationDays || DEFAULT_DURATION_DAYS);
    await war.startWar(duration);
    info(`Guerra ${war.id} iniciou.`);
    return war;
}

export async function addWarPoints(districtId, amount, reason) {
    const war = await War.findOne({
        status: "active",
        $or: [{ challengerDistrictId: districtId }, { targetDistrictId: districtId }]
    });
    if (!war) {
        return null;
    }

    await war.addPoints(districtId, amount, reason);
    await District.findByIdAndUpdate(districtId, { $inc: { points: amount } });
    return war;
}

export async function endWar(warId) {
    const war = await War.findById(warId);
    if (!war) {
        throw new Error("Guerra não encontrada.");
    }
    if (war.status !== "active") {
        throw new Error("Guerra não está ativa.");
    }

    await war.finishWar();
    const winnerId = war.winnerDistrictId;
    const loserId =
        winnerId === war.challengerDistrictId ? war.targetDistrictId : war.challengerDistrictId;

    if (winnerId) {
        await District.findByIdAndUpdate(winnerId, { $inc: { wins: 1 } });
        await District.findByIdAndUpdate(loserId, { $inc: { losses: 1 } });

        const loser = await District.findById(loserId);
        const transfer = loser ? Math.floor(loser.treasury * 0.1) : 0;
        if (transfer > 0) {
            await District.findByIdAndUpdate(winnerId, { $inc: { treasury: transfer } });
            await District.findByIdAndUpdate(loserId, { $inc: { treasury: -transfer } });
        }

        await registerDistrictWin(winnerId);
        const winnerDistrict = await District.findById(winnerId);
        if (winnerDistrict?.captainId) {
            await registerTopCaptain(winnerDistrict.captainId);
        }
        if (winnerDistrict?.members?.length) {
            const medal = await createMedal("1 guerra vencida", "⚔️");
            await Promise.all(
                winnerDistrict.members.map((memberId) =>
                    awardMedal(memberId, config.guildId, medal.id)
                )
            );
        }
    }

    await District.findByIdAndUpdate(war.challengerDistrictId, {
        $addToSet: { warHistory: war.id }
    });
    await District.findByIdAndUpdate(war.targetDistrictId, {
        $addToSet: { warHistory: war.id }
    });

    info(`Guerra encerrada. Vencedor: ${winnerId || "empate"}.`);
    return war;
}

export async function getActiveWar(districtId) {
    return War.findOne({
        status: "active",
        $or: [{ challengerDistrictId: districtId }, { targetDistrictId: districtId }]
    });
}

export async function getWarHistory(districtId) {
    return War.find({
        status: "finished",
        $or: [{ challengerDistrictId: districtId }, { targetDistrictId: districtId }]
    }).sort({ endDate: -1 });
}

export async function checkWarEnd() {
    const activeWars = await War.find({ status: "active" });
    for (const war of activeWars) {
        if (war.endDate && Date.now() >= war.endDate.getTime()) {
            await endWar(war.id);
        }
    }
}

export async function checkSeasonEnd() {
    if (!config.seasonDuration) {
        return null;
    }
    return null;
}
