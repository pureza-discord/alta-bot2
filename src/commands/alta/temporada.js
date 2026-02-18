import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { startSeason, endSeason } from "../../services/core/seasonService.js";

export const data = new SlashCommandBuilder()
    .setName("temporada")
    .setDescription("Sistema de temporadas")
    .addSubcommand((sub) => sub.setName("iniciar").setDescription("Iniciar temporada"))
    .addSubcommand((sub) => sub.setName("finalizar").setDescription("Finalizar temporada"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "iniciar") {
        const season = await startSeason(guildId);
        return interaction.reply({ content: `✅ Temporada ${season.numero} iniciada.`, ephemeral: true });
    }

    if (sub === "finalizar") {
        await endSeason(guildId);
        return interaction.reply({ content: "✅ Temporada finalizada.", ephemeral: true });
    }
}
