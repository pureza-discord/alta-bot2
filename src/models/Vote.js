import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        targetId: { type: String, required: true },
        status: { type: String, enum: ["open", "resolved"], default: "open" },
        votes: { type: Map, of: Number, default: {} },
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

voteSchema.index({ status: 1 });

export const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);
