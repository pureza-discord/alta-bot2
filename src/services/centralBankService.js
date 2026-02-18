import { CentralBank } from "./databaseService.js";

async function getBank() {
    const existing = await CentralBank.findOne();
    if (existing) return existing;
    return CentralBank.create({});
}

export async function addFunds(amount) {
    const bank = await getBank();
    bank.totalBalance += amount;
    bank.lastUpdated = new Date();
    await bank.save();
    return bank;
}

export async function removeFunds(amount) {
    const bank = await getBank();
    bank.totalBalance = Math.max(0, bank.totalBalance - amount);
    bank.lastUpdated = new Date();
    await bank.save();
    return bank;
}

export async function getBalance() {
    const bank = await getBank();
    return bank.totalBalance;
}
