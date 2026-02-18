import mongoose from "mongoose";

const warLogSchema = new mongoose.Schema(
    {
        districtId: { type: String, required: true },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const warSchema = new mongoose.Schema(
    {
        challengerDistrictId: { type: String, required: true },
        targetDistrictId: { type: String, required: true },
        status: { type: String, enum: ["pending", "active", "finished"], default: "pending" },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        challengerPoints: { type: Number, default: 0 },
        targetPoints: { type: Number, default: 0 },
        winnerDistrictId: { type: String, default: null },
        logs: { type: [warLogSchema], default: [] }
    },
    { timestamps: true }
);

warSchema.methods.startWar = function (durationDays = 7) {
    this.status = "active";
    this.startDate = new Date();
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + durationDays);
    this.endDate = end;
    return this.save();
};

warSchema.methods.addPoints = function (districtId, amount, reason) {
    if (districtId === this.challengerDistrictId) {
        this.challengerPoints += amount;
    } else if (districtId === this.targetDistrictId) {
        this.targetPoints += amount;
    } else {
        throw new Error("Distrito não participa desta guerra.");
    }
    this.logs.push({ districtId, amount, reason });
    return this.save();
};

warSchema.methods.calculateWinner = function () {
    if (this.challengerPoints > this.targetPoints) {
        return this.challengerDistrictId;
    }
    if (this.targetPoints > this.challengerPoints) {
        return this.targetDistrictId;
    }
    return null;
};

warSchema.methods.finishWar = function () {
    this.status = "finished";
    this.endDate = this.endDate || new Date();
    this.winnerDistrictId = this.calculateWinner();
    return this.save();
};

warSchema.methods.registerWarResult = function () {
    return this.save();
};

export const War = mongoose.models.War || mongoose.model("War", warSchema);
