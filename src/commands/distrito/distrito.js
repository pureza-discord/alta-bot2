import { SlashCommandBuilder } from "discord.js";
import { District } from "../../models/District.js";
import { User } from "../../models/User.js";
import { buildEmbed } from "../../utils/embed.js";

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findDistrictByName(name) {
    return District.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });
}

async function getUserProfile(userId, guildId) {
    return User.findOne({ userId, guildId });
}

export const data = new SlashCommandBuilder()
    .setName("distrito-legacy")
    .setDescription("Gerenciar distritos (famílias).")
    .addSubcommand((sub) =>
        sub
            .setName("criar")
            .setDescription("Criar um distrito.")
            .addStringOption((opt) =>
                opt.setName("nome").setDescription("Nome do distrito").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("entrar")
            .setDescription("Entrar em um distrito.")
            .addStringOption((opt) =>
                opt.setName("nome").setDescription("Nome do distrito").setRequired(true)
            )
    )
    .addSubcommand((sub) => sub.setName("sair").setDescription("Sair do distrito atual."))
    .addSubcommand((sub) => sub.setName("info").setDescription("Ver info do seu distrito."))
    .addSubcommand((sub) =>
        sub
            .setName("promover-comandante")
            .setDescription("Promover um membro a comandante.")
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Membro do distrito").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("nomear-conselheiro")
            .setDescription("Nomear conselheiro do distrito.")
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Membro do distrito").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("expulsar")
            .setDescription("Expulsar membro do distrito.")
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Membro do distrito").setRequired(true)
            )
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild?.id;
    const userId = interaction.user.id;

    if (!guildId) {
        return interaction.reply({ content: "❌ Comando disponível apenas em servidor.", ephemeral: true });
    }

    const userProfile = (await getUserProfile(userId, guildId)) || new User({ userId, guildId });

    if (subcommand === "criar") {
        const name = interaction.options.getString("nome", true).trim();
        if (userProfile.districtId) {
            return interaction.reply({ content: "❌ Você já está em um distrito.", ephemeral: true });
        }

        const existing = await findDistrictByName(name);
        if (existing) {
            return interaction.reply({ content: "❌ Já existe um distrito com esse nome.", ephemeral: true });
        }

        const district = await District.create({
            name,
            captainId: userId,
            members: [userId]
        });

        userProfile.districtId = district.id;
        await userProfile.save();

        return interaction.reply({
            content: `✅ Distrito **${district.name}** criado. Você é o Capitão.`,
            ephemeral: true
        });
    }

    if (subcommand === "entrar") {
        const name = interaction.options.getString("nome", true).trim();
        if (userProfile.districtId) {
            return interaction.reply({ content: "❌ Você já está em um distrito.", ephemeral: true });
        }

        const district = await findDistrictByName(name);
        if (!district) {
            return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
        }

        await district.addMember(userId);
        userProfile.districtId = district.id;
        await userProfile.save();

        return interaction.reply({
            content: `✅ Você entrou no distrito **${district.name}**.`,
            ephemeral: true
        });
    }

    if (!userProfile.districtId) {
        return interaction.reply({ content: "❌ Você não está em nenhum distrito.", ephemeral: true });
    }

    const district = await District.findById(userProfile.districtId);
    if (!district) {
        userProfile.districtId = null;
        await userProfile.save();
        return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
    }

    if (subcommand === "sair") {
        if (district.captainId === userId) {
            return interaction.reply({
                content: "❌ Capitão não pode sair do próprio distrito.",
                ephemeral: true
            });
        }
        await district.removeMember(userId);
        userProfile.districtId = null;
        await userProfile.save();
        return interaction.reply({ content: "✅ Você saiu do distrito.", ephemeral: true });
    }

    if (subcommand === "info") {
        const embed = buildEmbed({
            title: `🏛 Distrito: ${district.name}`,
            fields: [
                {
                    name: "👑 Capitão",
                    value: district.captainId ? `<@${district.captainId}>` : "Não definido",
                    inline: true
                },
                {
                    name: "🎖 Comandantes",
                    value:
                        district.commanders.length > 0
                            ? district.commanders.map((id) => `<@${id}>`).join(", ")
                            : "Nenhum",
                    inline: true
                },
                {
                    name: "🧠 Conselheiro",
                    value: district.counselorId ? `<@${district.counselorId}>` : "Nenhum",
                    inline: true
                },
                { name: "🪖 Membros", value: `${district.members.length}`, inline: true },
                { name: "⚔ Pontos", value: `${district.points}`, inline: true },
                { name: "🏆 Vitórias", value: `${district.wins}`, inline: true },
                { name: "💀 Derrotas", value: `${district.losses}`, inline: true },
                { name: "💰 Tesouro", value: `${district.treasury}`, inline: true }
            ]
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const targetUser = interaction.options.getUser("usuario", true);
    if (district.captainId !== userId) {
        return interaction.reply({
            content: "❌ Apenas o Capitão pode executar esta ação.",
            ephemeral: true
        });
    }

    if (!district.members.includes(targetUser.id)) {
        return interaction.reply({
            content: "❌ Este usuário não é membro do seu distrito.",
            ephemeral: true
        });
    }

    if (subcommand === "promover-comandante") {
        try {
            await district.promoteToCommander(targetUser.id);
            return interaction.reply({
                content: `✅ ${targetUser} foi promovido a comandante.`,
                ephemeral: true
            });
        } catch (err) {
            return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
        }
    }

    if (subcommand === "nomear-conselheiro") {
        await district.setCounselor(targetUser.id);
        return interaction.reply({
            content: `✅ ${targetUser} foi nomeado conselheiro.`,
            ephemeral: true
        });
    }

    if (subcommand === "expulsar") {
        if (targetUser.id === userId) {
            return interaction.reply({
                content: "❌ Você não pode expulsar a si mesmo.",
                ephemeral: true
            });
        }
        await district.removeMember(targetUser.id);
        await User.updateOne({ userId: targetUser.id, guildId }, { $set: { districtId: null } });
        return interaction.reply({
            content: `✅ ${targetUser} foi expulso do distrito.`,
            ephemeral: true
        });
    }
}
