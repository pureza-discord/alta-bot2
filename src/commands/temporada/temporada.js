import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Season, District, UserProfile } from "../../services/databaseService.js";

export const data = new SlashCommandBuilder()
    .setName("temporada-legacy")
    .setDescription("Sistema de temporada.")
    .addSubcommand((sub) => sub.setName("resetar").setDescription("Resetar temporada"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    await District.update({ points: 0 }, { where: {} });
    await UserProfile.update({ warPoints: 0 }, { where: {} });
    const last = await Season.findOne({ order: [["number", "DESC"]] });
    const nextNumber = last ? last.number + 1 : 1;
    await Season.create({ number: nextNumber, note: "Reset manual" });
    return interaction.reply({ content: "✅ Temporada resetada.", ephemeral: true });
}
