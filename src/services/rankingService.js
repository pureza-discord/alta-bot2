import { District, UserProfile, War } from "./databaseService.js";

export async function getDistrictRankingByPoints(limit = 10) {
    return District.findAll({ order: [["points", "DESC"]], limit });
}

export async function getDistrictRankingByWins(limit = 10) {
    return District.findAll({ order: [["points", "DESC"]], limit });
}

export async function getTopXP(limit = 10) {
    return UserProfile.findAll({ order: [["messages", "DESC"]], limit });
}

export async function getTopInfluence(limit = 10) {
    return UserProfile.findAll({ order: [["meritPoints", "DESC"]], limit });
}

export async function getTopRecruits(limit = 10) {
    return UserProfile.findAll({ order: [["recruits", "DESC"]], limit });
}

export async function getTopEvents(limit = 10) {
    return UserProfile.findAll({ order: [["events", "DESC"]], limit });
}

export async function getCurrentWarRanking() {
    const war = await War.findOne({ where: { status: "active" } });
    if (!war) return null;
    return war;
}
