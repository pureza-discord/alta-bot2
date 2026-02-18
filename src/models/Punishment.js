import mongoose from "mongoose";

const punishmentSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        type: { type: String, enum: ["warning", "influence_loss", "xp_block"], required: true },
        reason: { type: String, default: null },
        duration: { type: Number, default: null },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

punishmentSchema.index({ userId: 1, active: 1 });

export const Punishment =
    mongoose.models.Punishment || mongoose.model("Punishment", punishmentSchema);
