import mongoose from "mongoose";

const medalSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        icon: { type: String, default: "🏅" }
    },
    { timestamps: true }
);

medalSchema.index({ name: 1 }, { unique: true });

export const Medal = mongoose.models.Medal || mongoose.model("Medal", medalSchema);
