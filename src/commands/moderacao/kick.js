import { PermissionsBitField } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";
import { Logger } from '../../utils/logger.js';

export async function execute(message, args, client) {
    // Verificar permissões
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply({ 
            content: "❌ Você precisa da permissão **Expulsar Membros** para usar este comando.",
            ephemeral: true 
        });
    }

    // Verificar se o bot tem permissões
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply({ 
            content: "❌ Eu não tenho permissão para expulsar membros neste servidor.",
            ephemeral: true 
        });
    }

    if (!args[0]) {
        const helpEmbed = buildEmbed({
            title: "📋 Como usar o comando kick",
            description: "Use este comando para expulsar um membro do servidor.",
            fields: [
                { name: "📝 Sintaxe", value: "• `.kick <@membro|ID> [motivo]`", inline: false },
                { name: "📖 Exemplos", value: "• `.kick @usuário Comportamento inadequado`\n• `.kick 123456789 Spam repetido`", inline: false },
                { name: "⚠️ Observações", value: "• O motivo é opcional\n• Você precisa ter cargo superior ao alvo\n• O bot precisa ter cargo superior ao alvo\n• O membro pode retornar com convite", inline: false }
            ]
        });
        
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
            content: "❌ Você não pode expulsar a si mesmo.",
            ephemeral: true 
        });
    }

    if (member.id === client.user.id) {
        return message.reply({ 
            content: "❌ Eu não posso me expulsar.",
            ephemeral: true 
        });
    }

    if (member.id === message.guild.ownerId) {
        return message.reply({ 
            content: "❌ Não é possível expulsar o dono do servidor.",
            ephemeral: true 
        });
    }

    // Verificar hierarquia de cargos
    if (member.roles.highest.position >= message.member.roles.highest.position && 
        message.author.id !== message.guild.ownerId) {
        return message.reply({ 
            content: "❌ Você não pode expulsar alguém com cargo igual ou superior ao seu.",
            ephemeral: true 
        });
    }

    if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({ 
            content: "❌ Eu não posso expulsar alguém com cargo igual ou superior ao meu.",
            ephemeral: true 
        });
    }

    // Verificar se o membro pode ser expulso
    if (!member.kickable) {
        return message.reply({ 
            content: "❌ Este membro não pode ser expulso. Verifique a hierarquia de cargos.",
            ephemeral: true 
        });
    }

    try {
        // Tentar enviar DM antes de expulsar
        const dmEmbed = buildEmbed({
            title: "👢 Você foi expulso",
            description: `Você foi expulso do servidor **${message.guild.name}**.`,
            fields: [
                { name: "👮 Moderador", value: message.author.tag, inline: true },
                { name: "📝 Motivo", value: motivo, inline: false },
                { name: "ℹ️ Informação", value: "Você pode retornar ao servidor se receber um novo convite.", inline: false }
            ]
        });

        await member.send({ embeds: [dmEmbed] }).catch(() => {
            console.log(`Não foi possível enviar DM para ${member.user.tag}`);
        });

        // Expulsar o membro
        await member.kick(`${motivo} | Por: ${message.author.tag}`);

        // Log da moderação
        await Logger.logModeration(
            message.guild.id,
            member.id,
            message.author.id,
            'kick',
            motivo
        );

        // Embed de confirmação
        const embed = Logger.createModerationEmbed('kick', member.user, message.author, motivo);
        
        await message.reply({ embeds: [embed] });

        console.log(`👢 ${member.user.tag} foi expulso por ${message.author.tag} - Motivo: ${motivo}`);

    } catch (error) {
        console.error("Erro ao expulsar membro:", error);
        
        const errorEmbed = buildEmbed({
            title: "❌ Erro ao Expulsar",
            description: "Ocorreu um erro ao tentar expulsar o membro.",
            fields: [
                { name: "🔍 Possíveis causas", value: "• Falta de permissões\n• Hierarquia de cargos\n• Erro interno do Discord", inline: false }
            ]
        });
        
        await message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
}

