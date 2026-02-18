import mongoose from "mongoose";

const chatAnalyticsSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        guildId: { type: String, required: true },
        hourlyCounts: { type: [Number], default: Array(24).fill(0) },
        repliesCount: { type: Number, default: 0 },
        threadsCount: { type: Number, default: 0 },
        lastMessageAt: { type: Date, default: null }
    },
    { timestamps: true }
);

chatAnalyticsSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export const ChatAnalytics =
    mongoose.models.ChatAnalytics || mongoose.model("ChatAnalytics", chatAnalyticsSchema);
