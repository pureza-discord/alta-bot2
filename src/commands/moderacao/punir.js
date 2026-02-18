import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { applyPunishment } from "../../services/core/punishmentService.js";

export const data = new SlashCommandBuilder()
    .setName("punir")
    .setDescription("Aplicar punição inteligente.")
    .addUserOption((opt) =>
        opt.setName("usuario").setDescription("Usuário").setRequired(true)
    )
    .addStringOption((opt) =>
        opt
            .setName("tipo")
            .setDescription("Tipo de punição")
            .addChoices(
                { name: "warning", value: "warning" },
                { name: "influence_loss", value: "influence_loss" },
                { name: "xp_block", value: "xp_block" }
            )
            .setRequired(true)
    )
    .addIntegerOption((opt) =>
        opt.setName("duracao").setDescription("Duração em minutos (opcional)")
    )
    .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
    const hasAdminRole = interaction.member.roles.cache.some((role) =>
        role.name.toLowerCase().includes("administração")
    );
    if (!hasAdminRole) {
        return interaction.reply({
            content: "❌ Apenas Administração pode usar este comando.",
            ephemeral: true
        });
    }
    const user = interaction.options.getUser("usuario", true);
    const type = interaction.options.getString("tipo", true);
    const duration = interaction.options.getInteger("duracao") || null;
    const reason = interaction.options.getString("motivo") || null;

    await applyPunishment(interaction.guild.id, user.id, type, duration, reason);

    return interaction.reply({
        content: `✅ Punição aplicada em ${user}: ${type}`,
        ephemeral: true
    });
}
