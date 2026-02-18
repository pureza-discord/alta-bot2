import mongoose from "mongoose";

const hallOfFameSchema = new mongoose.Schema(
    {
        districtWins: { type: Map, of: Number, default: {} },
        captainWins: { type: Map, of: Number, default: {} },
        memberWarWins: { type: Map, of: Number, default: {} },
        topXp: { type: Map, of: Number, default: {} },
        topInfluence: { type: Map, of: Number, default: {} }
    },
    { timestamps: true }
);

export const HallOfFame =
    mongoose.models.HallOfFame || mongoose.model("HallOfFame", hallOfFameSchema);
