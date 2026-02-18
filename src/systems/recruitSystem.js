import { Recruitment, getOrCreateUser } from "../services/databaseService.js";
import { logRecruitment } from "../services/logService.js";
import { checkAutoPromotion } from "../services/promotionService.js";
import { addWarPoints } from "./warSystem.js";

const MIN_MESSAGES = 50;

export async function registerRecruit(recruiterId, newMemberId, guildId, guild) {
    const newMember = await getOrCreateUser(newMemberId, guildId);
    if (newMember.messages < MIN_MESSAGES) {
        throw new Error("Novo membro precisa de 50 mensagens para validar.");
    }

    await Recruitment.create({
        recruiterId,
        newMemberId,
        status: "approved"
    });

    const recruiter = await getOrCreateUser(recruiterId, guildId);
    recruiter.recruits += 1;
    await recruiter.save();

    if (recruiter.districtId) {
        await addWarPoints(recruiter.districtId, 30, "recruitment");
    }

    await checkAutoPromotion(recruiterId, guildId, guild);
    if (guild) {
        await logRecruitment(guild, { recruiterId, newMemberId, status: "approved" });
    }
}
