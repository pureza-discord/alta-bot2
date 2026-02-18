import { Medal } from "../models/Medal.js";
import { User } from "../models/User.js";

export async function createMedal(name, icon = "🏅") {
    return Medal.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, icon } },
        { new: true, upsert: true }
    );
}

export async function awardMedal(userId, guildId, medalId) {
    return User.findOneAndUpdate(
        { userId, guildId },
        { $addToSet: { medals: medalId }, $setOnInsert: { userId, guildId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
}

export async function removeMedal(userId, guildId, medalId) {
    return User.findOneAndUpdate(
        { userId, guildId },
        { $pull: { medals: medalId } },
        { new: true }
    );
}
