import { Contract } from "../models/Contract.js";
import { User } from "../models/User.js";
import { addMoney } from "./economyService.js";

export async function createContract(payload) {
    return Contract.create(payload);
}

export async function checkProgress(userId, guildId) {
    const contracts = await Contract.find({ active: true });
    const user = await User.findOne({ userId, guildId });
    if (!user) return [];

    return contracts.map((contract) => ({
        contract,
        progress: {
            messages: user.totalMessages,
            events: user.totalEvents,
            recruits: user.xpRecruit
        }
    }));
}

export async function completeContract(userId, guildId, contractId) {
    const contract = await Contract.findById(contractId);
    if (!contract || !contract.active) {
        throw new Error("Contrato não encontrado ou inativo.");
    }
    const user = await User.findOne({ userId, guildId });
    if (!user) {
        throw new Error("Usuário não encontrado.");
    }

    const meetsRequirements =
        user.totalMessages >= contract.requirements.messages &&
        user.totalEvents >= contract.requirements.events &&
        user.xpRecruit >= contract.requirements.recruits;

    if (!meetsRequirements) {
        throw new Error("Requisitos não atendidos.");
    }

    contract.active = false;
    await contract.save();

    if (contract.rewardXP > 0) {
        await User.addXP(userId, guildId, contract.rewardXP);
    }
    if (contract.rewardMoney > 0) {
        await addMoney(userId, guildId, contract.rewardMoney, {
            districtId: user.districtId,
            reason: "contract"
        });
    }

    return contract;
}

export async function expireContracts() {
    const now = new Date();
    await Contract.updateMany({ active: true, endDate: { $lt: now } }, { $set: { active: false } });
}
