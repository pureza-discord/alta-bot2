import { getOrCreateUser } from "../services/databaseService.js";
import { checkAutoPromotion } from "../services/promotionService.js";
import { checkIfBlocked } from "../services/core/punishmentService.js";
import { addWarPoints } from "./warSystem.js";

export async function onMessage(message) {
    const guildId = message.guild?.id;
    if (!guildId || message.author.bot) return;

    const blocked = await checkIfBlocked(guildId, message.author.id);
    if (blocked) return;

    const user = await getOrCreateUser(message.author.id, guildId);
    user.messages += 1;
    await user.save();

    if (user.districtId) {
        await addWarPoints(user.districtId, 1, "message");
    }

    await checkAutoPromotion(message.author.id, guildId, message.guild);
}
