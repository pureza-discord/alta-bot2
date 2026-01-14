import { EmbedBuilder } from "discord.js";
import { SERVER_CONFIG } from '../../utils/config.js';

export async function execute(message, args, client) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;
    const member = await message.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    // Verificar se tem cargo Dolls ou Capanga
    const hasDollsRole = member.roles.cache.has(SERVER_CONFIG.ROLES.FEMALE);
    const hasCapangaRole = member.roles.cache.has(SERVER_CONFIG.ROLES.CAPANGA);
    const hasNaoVerificadoRole = member.roles.cache.has(SERVER_CONFIG.ROLES.NAO_VERIFICADO);
    
    const hasTagNaPureza = hasDollsRole || hasCapangaRole;
    
    let statusText = '';
    let statusColor = '';
    let rolesList = [];
    
    if (hasDollsRole) {
        rolesList.push('🎭 Dolls');
    }
    if (hasCapangaRole) {
        rolesList.push('👤 Capanga');
    }
    if (hasNaoVerificadoRole) {
        rolesList.push('⚠️ Não Verificado');
    }
    
    if (hasTagNaPureza) {
        statusText = '✅ **TEM TAG NA PUREZA**';
        statusColor = '#00FF00';
    } else {
        statusText = '❌ **NÃO TEM TAG NA PUREZA**';
        statusColor = '#FF0000';
    }

    const embed = new EmbedBuilder()
        .setTitle('🔍 **VERIFICAÇÃO DE TAG NA PUREZA**')
        .setDescription(`**Verificação para:** ${user}\n\n${statusText}`)
        .addFields(
            {
                name: '👤 **Usuário**',
                value: `${user.tag}`,
                inline: true
            },
            {
                name: '🆔 **ID**',
                value: `\`${user.id}\``,
                inline: true
            },
            {
                name: '🏷️ **Tags Relevantes**',
                value: rolesList.length > 0 ? rolesList.join('\n') : 'Nenhuma tag relevante',
                inline: false
            },
            {
                name: '📊 **Status**',
                value: hasTagNaPureza ? 
                    '🟢 **Usuário possui tag na pureza**\n*Tem acesso aos canais especiais*' : 
                    hasNaoVerificadoRole ?
                        '🟡 **Usuário não verificado**\n*Precisa solicitar tag de gênero*' :
                        '🔴 **Usuário sem tags relevantes**\n*Não tem acesso aos canais especiais*',
                inline: false
            }
        )
        .setColor(statusColor)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
            text: `Verificação solicitada por ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
    
    console.log(`🔍 ${message.author.tag} verificou tag de ${user.tag}: ${hasTagNaPureza ? 'TEM' : 'NÃO TEM'} tag na pureza`);
}
