import { Season } from "../models/Season.js";
import { District } from "../models/District.js";
import { User } from "../models/User.js";
import { config } from "../config/index.js";

export async function getCurrentSeason() {
    return Season.findOne({ endDate: null }).sort({ number: -1 });
}

export async function startNewSeason() {
    const current = await getCurrentSeason();
    if (current) {
        return current;
    }
    const last = await Season.findOne().sort({ number: -1 });
    const number = last ? last.number + 1 : 1;
    return Season.create({ number, startDate: new Date() });
}

export async function endSeason() {
    const current = await getCurrentSeason();
    if (!current) {
        return null;
    }
    current.endDate = new Date();
    current.districtRanking = await saveSeasonRanking();
    await current.save();
    await resetDistrictPoints();
    return current;
}

export async function resetDistrictPoints() {
    await District.updateMany({}, { $set: { points: 0 } });
    await User.updateMany({}, { $set: { seasonalXP: 0 } });
}

export async function saveSeasonRanking(limit = 50) {
    const districts = await District.find().sort({ points: -1 }).limit(limit);
    return districts.map((district, index) => ({
        position: index + 1,
        districtId: district.id,
        points: district.points,
        wins: district.wins
    }));
}

export async function checkSeasonEnd() {
    const current = await getCurrentSeason();
    if (!current) {
        return null;
    }
    if (!config.seasonDuration) {
        return null;
    }
    const endAt = new Date(current.startDate);
    endAt.setDate(endAt.getDate() + config.seasonDuration);
    if (Date.now() >= endAt.getTime()) {
        await endSeason();
        await startNewSeason();
    }
    return current;
}
