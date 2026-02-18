import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        createdBy: { type: String, required: true },
        status: { type: String, enum: ["active", "finished"], default: "active" },
        participants: { type: [String], default: [] },
        winnerId: { type: String, default: null }
    },
    { timestamps: true }
);

export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
