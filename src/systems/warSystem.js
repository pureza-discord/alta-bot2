import { District, War, WarLog } from "../services/databaseService.js";
import { logWar } from "../services/logService.js";

export async function challengeWar(guild, districtAName, districtBName) {
    const [districtA, districtB] = await Promise.all([
        District.findOne({ where: { name: districtAName } }),
        District.findOne({ where: { name: districtBName } })
    ]);
    if (!districtA || !districtB) {
        throw new Error("Distrito não encontrado.");
    }
    const existing = await War.findOne({
        where: { status: ["pending", "active"] }
    });
    if (existing) {
        throw new Error("Já existe uma guerra pendente/ativa.");
    }
    const war = await War.create({
        districtAId: districtA.id,
        districtBId: districtB.id,
        status: "pending"
    });
    if (guild) {
        await logWar(guild, {
            districtA: districtA.name,
            districtB: districtB.name,
            status: "pending"
        });
    }
    return war;
}

export async function acceptWar(guild, warId) {
    const war = await War.findByPk(warId);
    if (!war || war.status !== "pending") {
        throw new Error("Guerra não encontrada ou inválida.");
    }
    war.status = "active";
    war.startDate = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    war.endDate = end;
    await war.save();
    if (guild) {
        await logWar(guild, {
            districtA: war.districtAId,
            districtB: war.districtBId,
            status: "active"
        });
    }
    return war;
}

export async function addWarPoints(districtId, amount, reason) {
    const war = await War.findOne({ where: { status: "active" } });
    if (!war) return null;

    if (war.districtAId !== districtId && war.districtBId !== districtId) {
        return null;
    }

    await WarLog.create({ warId: war.id, districtId, amount, reason });
    await District.increment({ points: amount }, { where: { id: districtId } });
    return war;
}

export async function finishWar(guild, warId, winnerDistrictId) {
    const war = await War.findByPk(warId);
    if (!war || war.status !== "active") {
        throw new Error("Guerra não encontrada ou inválida.");
    }
    war.status = "finished";
    war.endDate = new Date();
    war.winnerDistrictId = winnerDistrictId;
    await war.save();

    const winner = await District.findByPk(winnerDistrictId);
    if (winner) {
        await District.increment({ points: 50 }, { where: { id: winner.id } });
    }

    if (guild) {
        await logWar(guild, {
            districtA: war.districtAId,
            districtB: war.districtBId,
            status: "finished",
            reason: "finalizada"
        });
    }
    return war;
}
