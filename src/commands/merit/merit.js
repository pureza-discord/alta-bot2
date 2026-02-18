import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { addMerit, removeMerit } from "../../systems/meritSystem.js";

export const data = new SlashCommandBuilder()
    .setName("merit")
    .setDescription("Sistema de méritos.")
    .addSubcommand((sub) =>
        sub
            .setName("add")
            .setDescription("Adicionar méritos.")
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Usuário").setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt.setName("quantidade").setDescription("Quantidade").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("remove")
            .setDescription("Remover méritos.")
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Usuário").setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt.setName("quantidade").setDescription("Quantidade").setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

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
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("usuario", true);
    const amount = interaction.options.getInteger("quantidade", true);

    if (sub === "add") {
        await addMerit(user.id, interaction.guild.id, amount, interaction.guild);
        return interaction.reply({ content: "✅ Mérito adicionado.", ephemeral: true });
    }

    if (sub === "remove") {
        await removeMerit(user.id, interaction.guild.id, amount, interaction.guild);
        return interaction.reply({ content: "✅ Mérito removido.", ephemeral: true });
    }
}
