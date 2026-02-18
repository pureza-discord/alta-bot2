import { User } from "../models/User.js";
import { District } from "../models/District.js";
import { Transaction } from "../models/Transaction.js";
import { addFunds } from "./centralBankService.js";

const DISTRICT_SHARE = 0.05;
const CENTRAL_SHARE = 0.05;

export async function logTransaction({ userId, guildId, type, amount, meta = {} }) {
    return Transaction.create({ userId, guildId, type, amount, meta });
}

export async function addMoney(userId, guildId, amount, { districtId, reason } = {}) {
    const user = await User.addMoney(userId, guildId, amount);
    const resolvedDistrictId = districtId || user?.districtId;

    if (resolvedDistrictId) {
        const treasuryAmount = Math.floor(amount * DISTRICT_SHARE);
        if (treasuryAmount > 0) {
            await District.findByIdAndUpdate(resolvedDistrictId, {
                $inc: { treasury: treasuryAmount }
            });
        }

        const centralAmount = Math.floor(amount * CENTRAL_SHARE);
        if (centralAmount > 0) {
            await addFunds(centralAmount);
        }
    }

    await logTransaction({
        userId,
        guildId,
        type: "credit",
        amount,
        meta: { districtId: resolvedDistrictId, reason }
    });

    return user;
}

export async function removeMoney(userId, guildId, amount, { reason } = {}) {
    const user = await User.findOne({ userId, guildId });
    if (!user) {
        throw new Error("Usuário não encontrado.");
    }
    if (user.money < amount) {
        throw new Error("Saldo insuficiente.");
    }

    user.money -= amount;
    await user.save();

    await logTransaction({
        userId,
        guildId,
        type: "debit",
        amount,
        meta: { reason }
    });

    return user;
}

export async function transferMoney(fromUserId, toUserId, guildId, amount) {
    const sender = await removeMoney(fromUserId, guildId, amount, { reason: "transfer" });
    const receiver = await addMoney(toUserId, guildId, amount, { reason: "transfer" });

    await logTransaction({
        userId: fromUserId,
        guildId,
        type: "transfer_out",
        amount,
        meta: { toUserId }
    });

    await logTransaction({
        userId: toUserId,
        guildId,
        type: "transfer_in",
        amount,
        meta: { fromUserId }
    });

    return { sender, receiver };
}
