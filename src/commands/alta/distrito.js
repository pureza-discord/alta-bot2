import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
    createDistrict,
    setCaptain,
    setCommander,
    setCounselor,
    getDistrictRanking,
    findDistrictByName
} from "../../services/core/districtService.js";
import { getOrCreateUser, setDistrict } from "../../services/core/userService.js";

export const data = new SlashCommandBuilder()
    .setName("distrito")
    .setDescription("Gerenciar distritos.")
    .addSubcommand((sub) =>
        sub
            .setName("criar")
            .setDescription("Criar distrito")
            .addStringOption((opt) =>
                opt.setName("nome").setDescription("Nome do distrito").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("set-capitao")
            .setDescription("Definir capitão")
            .addStringOption((opt) =>
                opt.setName("nome").setDescription("Nome do distrito").setRequired(true)
            )
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Capitão").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("set-comandante")
            .setDescription("Definir comandante")
            .addStringOption((opt) =>
                opt.setName("nome").setDescription("Nome do distrito").setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt.setName("slot").setDescription("Slot 1 ou 2").setRequired(true)
            )
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Comandante").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("set-conselheiro")
            .setDescription("Definir conselheiro")
            .addStringOption((opt) =>
                opt.setName("nome").setDescription("Nome do distrito").setRequired(true)
            )
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Conselheiro").setRequired(true)
            )
    )
    .addSubcommand((sub) => sub.setName("ranking").setDescription("Ranking distrital"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "criar") {
        const nome = interaction.options.getString("nome", true);
        const distrito = await createDistrict(guildId, nome, interaction.user.id);
        await getOrCreateUser(guildId, interaction.user.id, {
            username: interaction.user.username,
            avatar: interaction.user.displayAvatarURL()
        });
        await setDistrict(guildId, interaction.user.id, distrito.id);
        return interaction.reply({ content: `✅ Distrito ${distrito.nome} criado.`, ephemeral: true });
    }

    if (sub === "set-capitao") {
        const nome = interaction.options.getString("nome", true);
        const user = interaction.options.getUser("usuario", true);
        const distrito = await findDistrictByName(guildId, nome);
        if (!distrito) return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
        await setCaptain(guildId, distrito.id, user.id);
        return interaction.reply({ content: "✅ Capitão atualizado.", ephemeral: true });
    }

    if (sub === "set-comandante") {
        const nome = interaction.options.getString("nome", true);
        const slot = interaction.options.getInteger("slot", true);
        const user = interaction.options.getUser("usuario", true);
        const distrito = await findDistrictByName(guildId, nome);
        if (!distrito) return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
        await setCommander(guildId, distrito.id, slot, user.id);
        return interaction.reply({ content: "✅ Comandante atualizado.", ephemeral: true });
    }

    if (sub === "set-conselheiro") {
        const nome = interaction.options.getString("nome", true);
        const user = interaction.options.getUser("usuario", true);
        const distrito = await findDistrictByName(guildId, nome);
        if (!distrito) return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
        await setCounselor(guildId, distrito.id, user.id);
        return interaction.reply({ content: "✅ Conselheiro atualizado.", ephemeral: true });
    }

    if (sub === "ranking") {
        const ranking = await getDistrictRanking(guildId);
        const lines = ranking.map((d, i) => `${i + 1}. ${d.nome} — ${d.pontos}`).join("\n");
        return interaction.reply({ content: lines || "Sem dados.", ephemeral: true });
    }
}
