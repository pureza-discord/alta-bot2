import {
    Event,
    EventParticipant,
    getOrCreateUser,
    UserProfile
} from "../services/databaseService.js";
import { addWarPoints } from "./warSystem.js";
import { logEvent } from "../services/logService.js";
import { checkAutoPromotion } from "../services/promotionService.js";

export async function createEvent(title, createdBy) {
    return Event.create({ title, createdBy, status: "created" });
}

export async function startEvent(eventId) {
    const event = await Event.findByPk(eventId);
    if (!event || event.status !== "created") {
        throw new Error("Evento inválido.");
    }
    event.status = "active";
    event.startedAt = new Date();
    await event.save();
    return event;
}

export async function registerParticipant(eventId, userId, guildId, guild) {
    const event = await Event.findByPk(eventId);
    if (!event || event.status !== "active") {
        throw new Error("Evento não encontrado ou não iniciado.");
    }
    const existing = await EventParticipant.findOne({ where: { eventId, userId } });
    if (!existing) {
        await EventParticipant.create({ eventId, userId });
        const user = await getOrCreateUser(userId, guildId);
        user.events += 1;
        await user.save();
        await checkAutoPromotion(userId, guildId, guild);
    }
    return event;
}

export async function finalizeEvent(eventId, winnerId, guildId, guild) {
    const event = await Event.findByPk(eventId);
    if (!event || event.status !== "active") {
        throw new Error("Evento inválido.");
    }
    event.status = "finished";
    event.endedAt = new Date();
    await event.save();

    const winner = await getOrCreateUser(winnerId, guildId);
    winner.xp += 50;
    winner.influence += 10;
    winner.money += 200;
    await winner.save();
    if (winner.districtId) {
        await addWarPoints(winner.districtId, 50, "event_win");
    }
    if (guild) {
        await logEvent(guild, {
            title: event.title,
            action: "finalizado",
            winner: winnerId
        });
    }
    return event;
}
