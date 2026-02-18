import mongoose from "mongoose";

const dailyMissionSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        guildId: { type: String, required: true },
        dateKey: { type: String, required: true },
        messages: { type: Number, default: 0 },
        eventParticipation: { type: Boolean, default: false },
        recruitments: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        rewardClaimed: { type: Boolean, default: false }
    },
    { timestamps: true }
);

dailyMissionSchema.index({ userId: 1, guildId: 1, dateKey: 1 }, { unique: true });

export const DailyMission =
    mongoose.models.DailyMission || mongoose.model("DailyMission", dailyMissionSchema);
