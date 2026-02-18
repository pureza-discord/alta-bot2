import { HallOfFame } from "../models/HallOfFame.js";
import { District } from "../models/District.js";

async function getOrCreateHall() {
    const existing = await HallOfFame.findOne();
    if (existing) return existing;
    return HallOfFame.create({});
}

export async function registerDistrictWin(districtId) {
    const hall = await getOrCreateHall();
    const current = hall.districtWins.get(districtId) || 0;
    hall.districtWins.set(districtId, current + 1);

    const district = await District.findById(districtId);
    if (district) {
        for (const memberId of district.members) {
            const memberWins = hall.memberWarWins.get(memberId) || 0;
            hall.memberWarWins.set(memberId, memberWins + 1);
        }
    }

    await hall.save();
    return hall;
}

export async function registerTopCaptain(userId) {
    const hall = await getOrCreateHall();
    const current = hall.captainWins.get(userId) || 0;
    hall.captainWins.set(userId, current + 1);
    await hall.save();
    return hall;
}

export async function registerTopXp(userId, amount) {
    const hall = await getOrCreateHall();
    const current = hall.topXp.get(userId) || 0;
    hall.topXp.set(userId, current + amount);
    await hall.save();
    return hall;
}

export async function registerTopInfluence(userId, amount) {
    const hall = await getOrCreateHall();
    const current = hall.topInfluence.get(userId) || 0;
    hall.topInfluence.set(userId, current + amount);
    await hall.save();
    return hall;
}

export async function getHistoricalLeaders() {
    const hall = await getOrCreateHall();

    const topDistrict = [...hall.districtWins.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCaptain = [...hall.captainWins.entries()].sort((a, b) => b[1] - a[1])[0];
    const topMember = [...hall.memberWarWins.entries()].sort((a, b) => b[1] - a[1])[0];
    const topXp = [...hall.topXp.entries()].sort((a, b) => b[1] - a[1])[0];
    const topInfluence = [...hall.topInfluence.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
        topDistrict: topDistrict ? { districtId: topDistrict[0], wins: topDistrict[1] } : null,
        topCaptain: topCaptain ? { userId: topCaptain[0], wins: topCaptain[1] } : null,
        topMember: topMember ? { userId: topMember[0], wins: topMember[1] } : null,
        topXp: topXp ? { userId: topXp[0], xp: topXp[1] } : null,
        topInfluence: topInfluence ? { userId: topInfluence[0], influence: topInfluence[1] } : null
    };
}
