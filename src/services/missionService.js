import { DailyMission } from "../models/DailyMission.js";
import { addMoney } from "./economyService.js";
import { addWarPoints } from "./warService.js";
import { User } from "../models/User.js";

const MESSAGE_TARGET = 20;
const RECRUIT_TARGET = 1;
const DAILY_REWARD = 150;

function getDateKey(date = new Date()) {
    return date.toISOString().split("T")[0];
}

export async function generateDailyMissions(userId, guildId) {
    const dateKey = getDateKey();
    return DailyMission.findOneAndUpdate(
        { userId, guildId, dateKey },
        { $setOnInsert: { userId, guildId, dateKey } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
}

export async function trackProgress(userId, guildId, type, amount = 1) {
    const dateKey = getDateKey();
    await generateDailyMissions(userId, guildId);

    const update = {};
    if (type === "message") update.$inc = { messages: amount };
    if (type === "event") update.$set = { eventParticipation: true };
    if (type === "recruit") update.$inc = { recruitments: amount };

    const mission = await DailyMission.findOneAndUpdate(
        { userId, guildId, dateKey },
        update,
        { new: true }
    );

    const isCompleted =
        mission.messages >= MESSAGE_TARGET &&
        mission.eventParticipation &&
        mission.recruitments >= RECRUIT_TARGET;

    if (isCompleted && !mission.completed) {
        mission.completed = true;
        await mission.save();
    }

    return mission;
}

export async function rewardUser(userId, guildId, districtId) {
    const dateKey = getDateKey();
    const mission = await DailyMission.findOne({ userId, guildId, dateKey });
    if (!mission || !mission.completed || mission.rewardClaimed) {
        return null;
    }

    mission.rewardClaimed = true;
    await mission.save();
    await addMoney(userId, guildId, DAILY_REWARD, { districtId, reason: "daily_mission" });

    const user = await User.findOne({ userId, guildId });
    if (user?.districtId) {
        await addWarPoints(user.districtId, 20, "mission");
    }

    return mission;
}

export async function resetDaily() {
    const dateKey = getDateKey();
    await DailyMission.deleteMany({ dateKey: { $ne: dateKey } });
}
