import mongoose from "mongoose";

const seasonSchema = new mongoose.Schema(
    {
        number: { type: Number, required: true },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: null },
        districtRanking: { type: [Object], default: [] }
    },
    { timestamps: true }
);

seasonSchema.index({ number: -1 });

export const Season = mongoose.models.Season || mongoose.model("Season", seasonSchema);
