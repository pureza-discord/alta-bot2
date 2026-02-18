import mongoose from "mongoose";

const centralBankSchema = new mongoose.Schema(
    {
        totalBalance: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export const CentralBank =
    mongoose.models.CentralBank || mongoose.model("CentralBank", centralBankSchema);
