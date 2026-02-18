import { PermissionsBitField } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";
import { Logger } from '../../utils/logger.js';

export async function execute(message, args, client) {
    // Verificar permissões
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply({ 
            content: "❌ Você precisa da permissão **Moderar Membros** para usar este comando.",
            ephemeral: true 
        });
    }

    // Verificar se o bot tem permissões
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply({ 
            content: "❌ Eu não tenho permissão para moderar membros neste servidor.",
            ephemeral: true 
        });
    }

    if (!args[0] || !args[1]) {
        const helpEmbed = buildEmbed({
            title: "📋 Como usar o comando timeout",
            description: "Use este comando para silenciar temporariamente um membro.",
            fields: [
                { name: "📝 Sintaxe", value: "• `.timeout <@membro|ID> <duração> [motivo]`", inline: false },
                { name: "⏰ Duração", value: "• Minutos: `30m` ou `30`\n• Horas: `2h`\n• Dias: `1d`\n• Máximo: 28 dias", inline: false },
                { name: "📖 Exemplos", value: "• `.timeout @usuário 30m Spam`\n• `.timeout @usuário 2h Comportamento inadequado`\n• `.timeout 123456789 1d Flood de mensagens`", inline: false },
                { name: "⚠️ Observações", value: "• O membro não poderá enviar mensagens\n• Não poderá entrar em calls\n• Não poderá reagir a mensagens", inline: false }
            ]
        });
        
        return message.reply({ embeds: [helpEmbed] });
    }

    // Buscar membro
    const member = message.mentions.members.first() || 
                  await message.guild.members.fetch(args[0]).catch(() => null);
    
    if (!member) {
        return message.reply({ 
            content: "❌ Membro não encontrado no servidor. Verifique se o ID/menção está correto.",
            ephemeral: true 
        });
    }

    // Parsear duração
    const durationInput = args[1].toLowerCase();
    let duration = 0; // em minutos
    
    if (durationInput.includes('d')) {
        duration = parseInt(durationInput) * 24 * 60;
    } else if (durationInput.includes('h')) {
        duration = parseInt(durationInput) * 60;
    } else if (durationInput.includes('m')) {
        duration = parseInt(durationInput);
    } else {
        duration = parseInt(durationInput); // assumir minutos se não especificado
    }

    if (isNaN(duration) || duration < 1 || duration > 40320) { // 28 dias = 40320 minutos
        return message.reply({ 
            content: "❌ Duração inválida. Use entre 1 minuto e 28 dias.\n**Exemplos:** `30m`, `2h`, `1d`, `60`",
            ephemeral: true 
        });
    }

    const motivo = args.slice(2).join(" ") || "Sem motivo fornecido";

    // Verificações de segurança
    if (member.id === message.author.id) {
        return message.reply({ 
            content: "❌ Você não pode silenciar a si mesmo.",
            ephemeral: true 
        });
    }

    if (member.id === client.user.id) {
        return message.reply({ 
            content: "❌ Eu não posso me silenciar.",
            ephemeral: true 
        });
    }

    if (member.id === message.guild.ownerId) {
        return message.reply({ 
            content: "❌ Não é possível silenciar o dono do servidor.",
            ephemeral: true 
        });
    }

    // Verificar hierarquia de cargos
    if (member.roles.highest.position >= message.member.roles.highest.position && 
        message.author.id !== message.guild.ownerId) {
        return message.reply({ 
            content: "❌ Você não pode silenciar alguém com cargo igual ou superior ao seu.",
            ephemeral: true 
        });
    }

    if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply({ 
            content: "❌ Eu não posso silenciar alguém com cargo igual ou superior ao meu.",
            ephemeral: true 
        });
    }

    // Verificar se o membro pode ser moderado
    if (!member.moderatable) {
        return message.reply({ 
            content: "❌ Este membro não pode ser silenciado. Verifique a hierarquia de cargos.",
            ephemeral: true 
        });
    }

    // Verificar se já está silenciado
    if (member.communicationDisabledUntil && member.communicationDisabledUntil > new Date()) {
        const timeRemaining = Math.floor((member.communicationDisabledUntil - new Date()) / 1000 / 60);
        return message.reply({ 
            content: `❌ Este membro já está silenciado por mais ${timeRemaining} minuto(s).`,
            ephemeral: true 
        });
    }

    try {
        const timeoutDuration = duration * 60 * 1000; // converter para millisegundos
        const timeoutUntil = new Date(Date.now() + timeoutDuration);

        // Tentar enviar DM antes de silenciar
        const dmEmbed = buildEmbed({
            title: "🔇 Você foi silenciado",
            description: `Você foi silenciado no servidor **${message.guild.name}**.`,
            fields: [
                { name: "👮 Moderador", value: message.author.tag, inline: true },
                { name: "⏰ Duração", value: Logger.formatDuration(duration * 60), inline: true },
                { name: "📝 Motivo", value: motivo, inline: false },
                { name: "⏰ Expira em", value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:F>`, inline: false }
            ]
        });

        await member.send({ embeds: [dmEmbed] }).catch(() => {
            console.log(`Não foi possível enviar DM para ${member.user.tag}`);
        });

        // Aplicar timeout
        await member.timeout(timeoutDuration, `${motivo} | Por: ${message.author.tag}`);

        // Log da moderação
        await Logger.logModeration(
            message.guild.id,
            member.id,
            message.author.id,
            'timeout',
            motivo,
            duration * 60 // em segundos
        );

        // Embed de confirmação
        const embed = Logger.createModerationEmbed('timeout', member.user, message.author, motivo, duration * 60);
        embed.addFields({ 
            name: "⏰ Expira em", 
            value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:F>`, 
            inline: true 
        });
        
        await message.reply({ embeds: [embed] });

        console.log(`🔇 ${member.user.tag} foi silenciado por ${message.author.tag} - Duração: ${duration}m - Motivo: ${motivo}`);

    } catch (error) {
        console.error("Erro ao silenciar membro:", error);
        
        const errorEmbed = buildEmbed({
            title: "❌ Erro ao Silenciar",
            description: "Ocorreu um erro ao tentar silenciar o membro.",
            fields: [
                { name: "🔍 Possíveis causas", value: "• Falta de permissões\n• Hierarquia de cargos\n• Duração inválida\n• Erro interno do Discord", inline: false }
            ]
        });
        
        await message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
}

