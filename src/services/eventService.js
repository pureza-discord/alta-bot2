import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { addMoney } from "./economyService.js";
import { addInfluence } from "./influenceService.js";
import { addWarPoints } from "./warService.js";
import { createMedal, awardMedal } from "./medalService.js";

export async function createEvent({ title, createdBy }) {
    return Event.create({ title, createdBy });
}

export async function addParticipant(eventId, userId) {
    const event = await Event.findById(eventId);
    if (!event || event.status !== "active") {
        throw new Error("Evento não encontrado ou já finalizado.");
    }
    if (!event.participants.includes(userId)) {
        event.participants.push(userId);
        await event.save();
    }
    return event;
}

export async function finalizeEvent({ eventId, winnerId, guildId, isSpecial = false }) {
    const event = await Event.findById(eventId);
    if (!event || event.status !== "active") {
        throw new Error("Evento não encontrado ou já finalizado.");
    }
    event.status = "finished";
    event.winnerId = winnerId;
    await event.save();

    const user = await User.findOneAndUpdate(
        { userId: winnerId, guildId },
        { $inc: { totalEvents: 1, totalWins: 1 }, $setOnInsert: { userId: winnerId, guildId } },
        { upsert: true, new: true }
    );

    await User.addXP(winnerId, guildId, 50, { xpEvent: 50, totalEvents: 1 });
    await addInfluence(winnerId, 10, guildId);
    await addMoney(winnerId, guildId, 200, { reason: "event_win" });

    if (user?.districtId) {
        await addWarPoints(user.districtId, isSpecial ? 100 : 50, "event_win");
    }

    if (user?.totalWins >= 5) {
        const medal = await createMedal("5 eventos ganhos", "🏆");
        await awardMedal(winnerId, guildId, medal.id);
    }

    return event;
}
