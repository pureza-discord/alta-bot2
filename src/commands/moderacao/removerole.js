import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Cargos**." });
    }

    if (!args[0] || !args[1]) {
        return message.reply({ content: "❌ Uso: `.removerole @membro @cargo`\nExemplo: `.removerole @membro @Moderador`" });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]) || message.guild.roles.cache.find(r => r.name === args.slice(1).join(" "));

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    if (!role) {
        return message.reply({ content: "❌ Cargo não encontrado." });
    }

    if (!member.roles.cache.has(role.id)) {
        return message.reply({ content: "❌ Este membro não possui este cargo." });
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
        return message.reply({ content: "❌ Você não pode remover um cargo igual ou superior ao seu." });
    }

    try {
        await member.roles.remove(role);

        const embed = buildEmbed({
            title: "➖ Cargo Removido",
            description: "Alteração de cargo registrada com sucesso.",
            fields: [
                { name: "👤 Membro", value: `${member.user.tag}`, inline: true },
                { name: "🎭 Cargo", value: `${role}`, inline: true },
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            ]
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao remover cargo:", error);
        message.reply({ content: "❌ Erro ao remover cargo. Verifique minhas permissões e a hierarquia de cargos." }).catch(() => {});
    }
}

