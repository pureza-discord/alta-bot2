import { SlashCommandBuilder } from "discord.js";
import { getHistoricalLeaders } from "../../services/hallOfFameService.js";
import { buildEmbed } from "../../utils/embed.js";

export const data = new SlashCommandBuilder()
    .setName("hall")
    .setDescription("Hall da Fama do servidor.");

export async function execute(interaction) {
    const hall = await getHistoricalLeaders();
    const embed = buildEmbed({
        title: "🏆 Hall da Fama",
        fields: [
            {
                name: "Top Distrito",
                value: hall.topDistrict ? `${hall.topDistrict.districtId} (${hall.topDistrict.wins})` : "—",
                inline: true
            },
            {
                name: "Top Capitão",
                value: hall.topCaptain ? `<@${hall.topCaptain.userId}> (${hall.topCaptain.wins})` : "—",
                inline: true
            },
            {
                name: "Top XP",
                value: hall.topXp ? `<@${hall.topXp.userId}> (${hall.topXp.xp})` : "—",
                inline: true
            },
            {
                name: "Top Influência",
                value: hall.topInfluence ? `<@${hall.topInfluence.userId}> (${hall.topInfluence.influence})` : "—",
                inline: true
            }
        ]
    });
    return interaction.reply({ embeds: [embed], ephemeral: true });
}
