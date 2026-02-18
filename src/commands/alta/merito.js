import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { addMerit, removeMerit } from "../../services/core/meritService.js";

export const data = new SlashCommandBuilder()
    .setName("merito")
    .setDescription("Sistema de mérito")
    .addSubcommand((sub) =>
        sub
            .setName("add")
            .setDescription("Adicionar mérito")
            .addUserOption((opt) => opt.setName("usuario").setDescription("Usuário").setRequired(true))
            .addIntegerOption((opt) => opt.setName("quantidade").setDescription("Quantidade").setRequired(true))
    )
    .addSubcommand((sub) =>
        sub
            .setName("remove")
            .setDescription("Remover mérito")
            .addUserOption((opt) => opt.setName("usuario").setDescription("Usuário").setRequired(true))
            .addIntegerOption((opt) => opt.setName("quantidade").setDescription("Quantidade").setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("usuario", true);
    const amount = interaction.options.getInteger("quantidade", true);
    const guildId = interaction.guild.id;

    if (sub === "add") {
        await addMerit(interaction.guild, guildId, user.id, amount);
        return interaction.reply({ content: "✅ Mérito adicionado.", ephemeral: true });
    }
    if (sub === "remove") {
        await removeMerit(guildId, user.id, amount);
        return interaction.reply({ content: "✅ Mérito removido.", ephemeral: true });
    }
}
