import { ChatAnalytics } from "../models/ChatAnalytics.js";
import { createMedal, awardMedal } from "./medalService.js";
import { config } from "../config/index.js";

export async function trackMessage(message) {
    const guildId = message.guild?.id || config.guildId;
    if (!guildId) return null;

    const hour = new Date().getHours();
    const isReply = Boolean(message.reference);
    const hasThread = Boolean(message.hasThread);

    const analytics = await ChatAnalytics.findOneAndUpdate(
        { userId: message.author.id, guildId },
        {
            $setOnInsert: { userId: message.author.id, guildId },
            $set: { lastMessageAt: new Date() },
            $inc: {
                [`hourlyCounts.${hour}`]: 1,
                repliesCount: isReply ? 1 : 0,
                threadsCount: hasThread ? 1 : 0
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return analytics;
}

export async function getHeatmap(guildId = config.guildId) {
    const results = await ChatAnalytics.find({ guildId });
    const heatmap = Array(24).fill(0);
    for (const item of results) {
        item.hourlyCounts.forEach((count, index) => {
            heatmap[index] += count;
        });
    }
    return heatmap;
}

export async function getEngagement(userId, guildId = config.guildId) {
    const analytics = await ChatAnalytics.findOne({ userId, guildId });
    if (!analytics) {
        return { replies: 0, threads: 0 };
    }
    return { replies: analytics.repliesCount, threads: analytics.threadsCount };
}

export async function awardWeeklyMover(guildId = config.guildId) {
    const results = await ChatAnalytics.find({ guildId });
    if (results.length === 0) return null;

    const top = results
        .map((item) => ({
            userId: item.userId,
            total: item.hourlyCounts.reduce((sum, value) => sum + value, 0)
        }))
        .sort((a, b) => b.total - a.total)[0];

    if (!top) return null;

    const medal = await createMedal("Movimentador da Semana", "🔥");
    await awardMedal(top.userId, guildId, medal.id);
    return top;
}
