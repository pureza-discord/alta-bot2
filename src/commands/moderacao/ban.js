import { PermissionsBitField, EmbedBuilder } from "discord.js";
import { Logger } from '../../utils/logger.js';

export async function execute(message, args, client) {
    // Verificar permissões
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply({ 
            content: "❌ Você precisa da permissão **Banir Membros** para usar este comando.",
            ephemeral: true 
        });
    }

    // Verificar se o bot tem permissões
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply({ 
            content: "❌ Eu não tenho permissão para banir membros neste servidor.",
            ephemeral: true 
        });
    }

    if (!args[0]) {
        const helpEmbed = new EmbedBuilder()
            .setTitle("📋 Como usar o comando ban")
            .setDescription("Use este comando para banir um membro do servidor.")
            .addFields(
                { name: "📝 Sintaxe", value: "`.ban <@membro|ID> [motivo]`" },
                { name: "📖 Exemplos", value: "`.ban @usuário Spam nas mensagens`\n`.ban 123456789 Comportamento inadequado`" },
                { name: "⚠️ Observações", value: "• O motivo é opcional\n• Você precisa ter cargo superior ao alvo\n• O bot precisa ter cargo superior ao alvo" }
            )
            .setColor("#2b2d31")
            .setTimestamp();
        
        return message.reply({ embeds: [helpEmbed] });
    }

    // Buscar membro
    const member = message.mentions.members.first() || 
                  await message.guild.members.fetch(args[0]).catch(() => null);
    
    const motivo = args.slice(1).join(" ") || "Sem motivo fornecido";

    if (!member) {
        return message.reply({ 
            content: "❌ Membro não encontrado no servidor. Verifique se o ID/menção está correto.",
            ephemeral: true 
        });
    }

    // Verificações de segurança
    if (member.id === message.author.id) {
        return message.reply({ 
            content: "❌ Você não pode banir a si mesmo.",
            ephemeral: true 
        });
    }

    if (member.id === client.user.id) {
        return message.reply({ 
            content: "❌ Eu não posso me banir.",
            ephemeral: true 
        });
    }

    if (member.id === message.guild.ownerId) {
        return message.reply({ 
            content: "❌ Não é possível banir o dono do servidor.",
            ephemeral: true 
        });
    }

    // Verificar hierarquia de cargos
    if (member.roles.highest.position >= message.member.roles.highest.position && 
        message.author.id !== message.guild.ownerId) {
        return message.reply({ 
            content: "❌ Você não pode banir alguém com cargo igual ou superior ao seu.",
            ephemeral: true 
        });
    }

    if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({ 
            content: "❌ Eu não posso banir alguém com cargo igual ou superior ao meu.",
            ephemeral: true 
        });
    }

    // Verificar se o membro pode ser banido
    if (!member.bannable) {
        return message.reply({ 
            content: "❌ Este membro não pode ser banido. Verifique a hierarquia de cargos.",
            ephemeral: true 
        });
    }

    try {
        // Tentar enviar DM antes de banir
        const dmEmbed = new EmbedBuilder()
            .setTitle("🔨 Você foi banido")
            .setDescription(`Você foi banido do servidor **${message.guild.name}**.`)
            .addFields(
                { name: "👮 Moderador", value: message.author.tag, inline: true },
                { name: "📝 Motivo", value: motivo, inline: false }
            )
            .setColor("#ff0000")
            .setTimestamp();

        await member.send({ embeds: [dmEmbed] }).catch(() => {
            console.log(`Não foi possível enviar DM para ${member.user.tag}`);
        });

        // Banir o membro
        await member.ban({ 
            reason: `${motivo} | Por: ${message.author.tag}`,
            deleteMessageSeconds: 86400 // Deletar mensagens das últimas 24h
        });

        // Log da moderação
        await Logger.logModeration(
            message.guild.id,
            member.id,
            message.author.id,
            'ban',
            motivo
        );

        // Embed de confirmação
        const embed = Logger.createModerationEmbed('ban', member.user, message.author, motivo);
        
        await message.reply({ embeds: [embed] });

        console.log(`🔨 ${member.user.tag} foi banido por ${message.author.tag} - Motivo: ${motivo}`);

    } catch (error) {
        console.error("Erro ao banir membro:", error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle("❌ Erro ao Banir")
            .setDescription("Ocorreu um erro ao tentar banir o membro.")
            .addFields(
                { name: "🔍 Possíveis causas", value: "• Falta de permissões\n• Hierarquia de cargos\n• Erro interno do Discord" }
            )
            .setColor("#ff0000")
            .setTimestamp();
        
        await message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
}

