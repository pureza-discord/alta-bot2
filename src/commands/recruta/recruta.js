import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { registerRecruit } from "../../services/core/recruitmentService.js";
import { getUser } from "../../services/core/userService.js";

export const data = new SlashCommandBuilder()
    .setName("recruta")
    .setDescription("Sistema de recrutamento.")
    .addSubcommand((sub) =>
        sub
            .setName("registrar")
            .setDescription("Registrar recruta.")
            .addUserOption((opt) =>
                opt.setName("indicador").setDescription("Indicador").setRequired(true)
            )
            .addUserOption((opt) =>
                opt.setName("novo_membro").setDescription("Novo membro").setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const indicador = interaction.options.getUser("indicador", true);
    const novo = interaction.options.getUser("novo_membro", true);
    try {
        const indicadorProfile = await getUser(interaction.guild.id, indicador.id);
        await registerRecruit(
            interaction.guild.id,
            indicador.id,
            novo.id,
            indicadorProfile?.distritoId || null,
            interaction.guild
        );
        return interaction.reply({ content: "✅ Recruta registrada.", ephemeral: true });
    } catch (error) {
        return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
    }
}
