import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        guildId: { type: String, required: true },
        type: { type: String, required: true },
        amount: { type: Number, required: true },
        meta: { type: Object, default: {} }
    },
    { timestamps: true }
);

transactionSchema.index({ userId: 1, guildId: 1 });

export const Transaction =
    mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
