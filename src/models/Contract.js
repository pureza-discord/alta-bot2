import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        requirements: {
            messages: { type: Number, default: 0 },
            events: { type: Number, default: 0 },
            recruits: { type: Number, default: 0 }
        },
        rewardXP: { type: Number, default: 0 },
        rewardMoney: { type: Number, default: 0 },
        districtOnly: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
        endDate: { type: Date, default: null }
    },
    { timestamps: true }
);

contractSchema.index({ active: 1, endDate: 1 });

export const Contract = mongoose.models.Contract || mongoose.model("Contract", contractSchema);
