import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} from "discord.js";
import { success, warn } from "../../utils/logger.js";

export const data = new SlashCommandBuilder()
    .setName("admin-reset-estrutura")
    .setDescription("Resetar cargos, categorias e canais da estrutura do servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const ROLE_NAMES = [
    "Dono Supremo",
    "Conselho",
    "Capitão",
    "Comandante",
    "Conselheiro",
    "Membro",
    "VIP"
];
const CATEGORY_CONFIG = [
    { name: "ALTA CÚPULA", channels: ["avisos", "reunioes"], restrictedTo: ["Dono Supremo", "Conselho"] },
    { name: "ADMINISTRAÇÃO", channels: ["admin-chat", "logs"], restrictedTo: ["Dono Supremo", "Conselho"] },
    { name: "FACÇÕES", channels: ["familias", "acordos"] },
    { name: "GUERRA", channels: ["estrategia", "batalhas"] },
    { name: "EVENTOS", channels: ["agenda", "inscricoes"] },
    { name: "VIP", channels: ["vip-chat"], restrictedTo: ["VIP"] },
    { name: "GERAL", channels: ["geral", "bate-papo", "comandos"] }
];

export async function execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: "❌ Você não tem permissão para executar este comando.",
            ephemeral: true
        });
    }

    const confirmId = `admin_reset_confirm:${interaction.user.id}`;
    const cancelId = `admin_reset_cancel:${interaction.user.id}`;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(confirmId).setLabel("Confirmar").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(cancelId).setLabel("Cancelar").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
        content:
            "⚠️ Este comando irá **resetar toda a estrutura** do servidor (cargos, categorias e canais).\n" +
            "Confirme para continuar.",
        components: [row],
        ephemeral: true
    });
}

export async function runReset(interaction) {
    const guild = interaction.guild;
    if (!guild) {
        return interaction.reply({ content: "❌ Servidor não encontrado.", ephemeral: true });
    }

    await interaction.reply({ content: "🔄 Resetando estrutura...", ephemeral: true });

    const everyoneRole = guild.roles.everyone;
    const rolesToDelete = guild.roles.cache.filter((role) => role.id !== everyoneRole.id);
    for (const role of rolesToDelete.values()) {
        try {
            await role.delete("Reset estrutural solicitado.");
        } catch {
            warn("Falha ao deletar cargo", { roleId: role.id });
        }
    }

    const createdRoles = [];
    for (const roleName of ROLE_NAMES) {
        const role = await guild.roles.create({
            name: roleName,
            reason: "Reset estrutural solicitado."
        });
        createdRoles.push(role);
    }

    const roleByName = createdRoles.reduce((acc, role) => {
        acc[role.name] = role;
        return acc;
    }, {});

    const categories = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildCategory
    );
    for (const category of categories.values()) {
        try {
            await category.delete("Reset estrutural solicitado.");
        } catch {
            warn("Falha ao deletar categoria", { channelId: category.id });
        }
    }

    for (const categoryConfig of CATEGORY_CONFIG) {
        const permissionOverwrites = [];
        if (categoryConfig.restrictedTo && categoryConfig.restrictedTo.length > 0) {
            permissionOverwrites.push({
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
            });

            for (const roleName of categoryConfig.restrictedTo) {
                const role = roleByName[roleName];
                if (role) {
                    permissionOverwrites.push({
                        id: role.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    });
                }
            }
        }

        const category = await guild.channels.create({
            name: categoryConfig.name,
            type: ChannelType.GuildCategory,
            permissionOverwrites,
            reason: "Reset estrutural solicitado."
        });

        for (const channelName of categoryConfig.channels) {
            await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                reason: "Reset estrutural solicitado."
            });
        }
    }

    success("Estrutura do servidor resetada com sucesso.");
    await interaction.editReply({ content: "✅ Estrutura resetada com sucesso!" });
}
