import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        guildId: { type: String, required: true },
        xpTotal: { type: Number, default: 0 },
        level: { type: Number, default: 0 },
        xpSocial: { type: Number, default: 0 },
        xpEvent: { type: Number, default: 0 },
        xpRecruit: { type: Number, default: 0 },
        weeklyXP: { type: Number, default: 0 },
        seasonalXP: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastMessageAt: { type: Date, default: null },
        prestige: { type: Number, default: 0 },
        influence: { type: Number, default: 0 },
        districtId: { type: String, default: null },
        vipType: { type: String, default: null },
        medals: { type: [String], default: [] },
        money: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        totalEvents: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 }
    },
    { timestamps: true }
);

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

userSchema.statics.addXP = async function (userId, guildId, amount, extra = {}) {
    const inc = {
        xpTotal: amount,
        weeklyXP: amount,
        seasonalXP: amount
    };

    if (extra.xpSocial) inc.xpSocial = extra.xpSocial;
    if (extra.xpEvent) inc.xpEvent = extra.xpEvent;
    if (extra.xpRecruit) inc.xpRecruit = extra.xpRecruit;
    if (extra.totalMessages) inc.totalMessages = extra.totalMessages;
    if (extra.totalEvents) inc.totalEvents = extra.totalEvents;
    if (extra.totalWins) inc.totalWins = extra.totalWins;

    const update = {
        $inc: inc,
        $setOnInsert: { userId, guildId }
    };

    if (extra.lastMessageAt) {
        update.$set = { lastMessageAt: extra.lastMessageAt };
    }

    return this.findOneAndUpdate(
        { userId, guildId },
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

userSchema.statics.addInfluence = async function (userId, guildId, amount) {
    return this.findOneAndUpdate(
        { userId, guildId },
        { $inc: { influence: amount }, $setOnInsert: { userId, guildId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

userSchema.statics.addMoney = async function (userId, guildId, amount) {
    return this.findOneAndUpdate(
        { userId, guildId },
        { $inc: { money: amount }, $setOnInsert: { userId, guildId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
