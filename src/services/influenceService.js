import { User } from "../models/User.js";
import { Vote } from "../models/Vote.js";
import { config } from "../config/index.js";
import { registerTopInfluence } from "./hallOfFameService.js";

export async function addInfluence(userId, amount, guildId = config.guildId) {
    const user = await User.findOneAndUpdate(
        { userId, guildId },
        { $inc: { influence: amount }, $setOnInsert: { userId, guildId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await registerTopInfluence(userId, amount);
    return user;
}

export async function removeInfluence(userId, amount, guildId = config.guildId) {
    return User.findOneAndUpdate(
        { userId, guildId },
        { $inc: { influence: -amount }, $setOnInsert: { userId, guildId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
}

export async function getTopInfluence(limit = 10) {
    return User.find({ guildId: config.guildId }).sort({ influence: -1 }).limit(limit);
}

export async function createVote(type, targetId) {
    return Vote.create({ type, targetId, status: "open", votes: {} });
}

export async function castVote(userId, voteId, value = 1) {
    const vote = await Vote.findById(voteId);
    if (!vote) {
        throw new Error("Votação não encontrada.");
    }
    if (vote.status !== "open") {
        throw new Error("Votação já foi encerrada.");
    }
    vote.votes.set(userId, value);
    await vote.save();
    return vote;
}

export async function resolveVote(voteId) {
    const vote = await Vote.findById(voteId);
    if (!vote) {
        throw new Error("Votação não encontrada.");
    }
    if (vote.status !== "open") {
        return vote;
    }

    let score = 0;
    for (const value of vote.votes.values()) {
        score += value;
    }
    vote.status = "resolved";
    await vote.save();
    return { vote, approved: score > 0, score };
}
