import { SlashCommandBuilder } from "discord.js";
import { getActiveDistrictMissions } from "../../services/core/missionService.js";
import { getUser } from "../../services/core/userService.js";

export const data = new SlashCommandBuilder()
    .setName("missao-distrito")
    .setDescription("Missões sazonais do distrito")
    .addSubcommand((sub) => sub.setName("listar").setDescription("Listar missões ativas"));

export async function execute(interaction) {
    const guildId = interaction.guild.id;
    const user = await getUser(guildId, interaction.user.id);
    if (!user?.distritoId) {
        return interaction.reply({ content: "❌ Você não está em um distrito.", ephemeral: true });
    }
    const missions = await getActiveDistrictMissions(guildId, user.distritoId);
    if (missions.length === 0) {
        return interaction.reply({ content: "✅ Sem missões sazonais ativas.", ephemeral: true });
    }
    const lines = missions.map(
        (m) => `• ${m.tipo} — ${m.progresso}/${m.objetivo} (recompensa ${m.recompensa})`
    );
    return interaction.reply({ content: lines.join("\n"), ephemeral: true });
}
