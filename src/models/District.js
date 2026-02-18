import mongoose from "mongoose";

const districtSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        captainId: { type: String, required: true },
        commanders: { type: [String], default: [] },
        counselorId: { type: String, default: null },
        members: { type: [String], default: [] },
        points: { type: Number, default: 0 },
        treasury: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        warHistory: { type: [String], default: [] }
    },
    { timestamps: true }
);

districtSchema.index({ points: -1 });
districtSchema.index({ wins: -1 });

districtSchema.methods.addMember = function (userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
    }
    return this.save();
};

districtSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter((id) => id !== userId);
    this.commanders = this.commanders.filter((id) => id !== userId);
    if (this.counselorId === userId) {
        this.counselorId = null;
    }
    if (this.captainId === userId) {
        this.captainId = null;
    }
    return this.save();
};

districtSchema.methods.promoteToCommander = function (userId) {
    if (this.commanders.includes(userId)) {
        return this;
    }
    if (this.commanders.length >= 2) {
        throw new Error("Limite de 2 comandantes atingido.");
    }
    this.commanders.push(userId);
    if (!this.members.includes(userId)) {
        this.members.push(userId);
    }
    return this.save();
};

districtSchema.methods.setCounselor = function (userId) {
    this.counselorId = userId;
    if (!this.members.includes(userId)) {
        this.members.push(userId);
    }
    return this.save();
};

districtSchema.methods.addPoints = function (amount) {
    this.points += amount;
    return this.save();
};

districtSchema.methods.addTreasury = function (amount) {
    this.treasury += amount;
    return this.save();
};

districtSchema.methods.recordWin = function () {
    this.wins += 1;
    return this.save();
};

districtSchema.methods.recordLoss = function () {
    this.losses += 1;
    return this.save();
};

export const District = mongoose.models.District || mongoose.model("District", districtSchema);
