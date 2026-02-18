import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { createContract, getActiveContracts } from "../../services/core/contractService.js";
import { findDistrictByName } from "../../services/core/districtService.js";
import { getUser } from "../../services/core/userService.js";

export const data = new SlashCommandBuilder()
    .setName("contrato")
    .setDescription("Contratos por distrito")
    .addSubcommand((sub) => sub.setName("listar").setDescription("Listar contratos ativos"))
    .addSubcommand((sub) =>
        sub
            .setName("criar")
            .setDescription("Criar contrato para distrito")
            .addStringOption((opt) => opt.setName("distrito").setDescription("Nome do distrito").setRequired(true))
            .addIntegerOption((opt) => opt.setName("mensagens").setDescription("Meta de mensagens").setRequired(true))
            .addIntegerOption((opt) => opt.setName("recrutas").setDescription("Meta de recrutas").setRequired(true))
            .addIntegerOption((opt) => opt.setName("recompensa").setDescription("Recompensa (pontos)").setRequired(true))
            .addStringOption((opt) => opt.setName("descricao").setDescription("Descrição").setRequired(true))
    );

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "listar") {
        const user = await getUser(guildId, interaction.user.id);
        if (!user?.distritoId) {
            return interaction.reply({ content: "❌ Você não está em um distrito.", ephemeral: true });
        }
        const contracts = await getActiveContracts(guildId, user.distritoId);
        if (contracts.length === 0) {
            return interaction.reply({ content: "✅ Sem contratos ativos no seu distrito.", ephemeral: true });
        }
        const lines = contracts.map(
            (c) =>
                `• ${c.descricao} — ${c.progressoMensagens}/${c.metaMensagens} msgs, ${c.progressoRecrutas}/${c.metaRecrutas} recrutas`
        );
        return interaction.reply({ content: lines.join("\n"), ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Apenas administradores podem criar contratos.", ephemeral: true });
    }

    if (sub === "criar") {
        const nomeDistrito = interaction.options.getString("distrito", true);
        const mensagens = interaction.options.getInteger("mensagens", true);
        const recrutas = interaction.options.getInteger("recrutas", true);
        const recompensa = interaction.options.getInteger("recompensa", true);
        const descricao = interaction.options.getString("descricao", true);
        const district = await findDistrictByName(guildId, nomeDistrito);
        if (!district) {
            return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
        }
        await createContract(guildId, district.id, descricao, mensagens, recrutas, recompensa, null);
        return interaction.reply({ content: "✅ Contrato criado.", ephemeral: true });
    }
}
