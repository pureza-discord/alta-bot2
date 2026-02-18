import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { reorganizeStructure } from "../../systems/hierarchySystem.js";

export const data = new SlashCommandBuilder()
    .setName("estrutura")
    .setDescription("Reorganizar estrutura do servidor.")
    .addSubcommand((sub) => sub.setName("reorganizar").setDescription("Aplicar estrutura oficial."))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    await interaction.reply({ content: "🔄 Reorganizando estrutura...", ephemeral: true });
    await reorganizeStructure(interaction.guild);
    await interaction.editReply({ content: "✅ Estrutura reorganizada." });
}
