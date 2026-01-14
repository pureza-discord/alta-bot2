import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Cargos**." });
    }

    if (!args[0] || !args[1]) {
        return message.reply({ content: "❌ Uso: `.addrole @membro @cargo`\nExemplo: `.addrole @membro @Moderador`" });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]) || message.guild.roles.cache.find(r => r.name === args.slice(1).join(" "));

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    if (!role) {
        return message.reply({ content: "❌ Cargo não encontrado." });
    }

    if (member.roles.cache.has(role.id)) {
        return message.reply({ content: "❌ Este membro já possui este cargo." });
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
        return message.reply({ content: "❌ Você não pode adicionar um cargo igual ou superior ao seu." });
    }

    try {
        await member.roles.add(role);

        const embed = new EmbedBuilder()
            .setTitle("➕ Cargo Adicionado")
            .setColor(role.color || "#2b2d31")
            .addFields(
                { name: "👤 Membro", value: `${member.user.tag}`, inline: true },
                { name: "🎭 Cargo", value: `${role}`, inline: true },
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao adicionar cargo:", error);
        message.reply({ content: "❌ Erro ao adicionar cargo. Verifique minhas permissões e a hierarquia de cargos." }).catch(() => {});
    }
}

