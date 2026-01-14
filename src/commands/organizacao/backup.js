import { PermissionsBitField, EmbedBuilder } from 'discord.js';
import { BackupSystem } from '../../systems/backup.js';
import { SERVER_CONFIG } from '../../utils/config.js';

const backupSystem = new BackupSystem();

export async function execute(message, args, client) {
    // Verificar permissões
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply({ 
            content: '❌ Você precisa da permissão **Administrador** para usar este comando.',
            ephemeral: true 
        });
    }
    
    // Verificar se é staff
    const hasStaffRole = message.member.roles.cache.some(role => 
        SERVER_CONFIG.STAFF_ROLES.includes(role.id)
    );
    
    if (!hasStaffRole) {
        return message.reply({ 
            content: '❌ Apenas membros da staff podem usar comandos de backup.',
            ephemeral: true 
        });
    }
    
    const subCommand = args[0]?.toLowerCase();
    
    switch (subCommand) {
        case 'create':
        case 'criar':
            await handleCreateBackup(message, client);
            break;
            
        case 'restore':
        case 'restaurar':
            await handleRestoreBackup(message, args.slice(1), client);
            break;
            
        case 'info':
        case 'informações':
            await handleBackupInfo(message, client);
            break;
            
        default:
            await showBackupHelp(message);
            break;
    }
}

async function handleCreateBackup(message, client) {
    try {
        const loadingEmbed = new EmbedBuilder()
            .setTitle('📦 Criando Backup...')
            .setDescription('Por favor aguarde, este processo pode demorar alguns minutos.')
            .setColor('#ffa500')
            .setTimestamp();
        
        const loadingMessage = await message.reply({ embeds: [loadingEmbed] });
        
        // Criar backup
        await backupSystem.createBackup(message.guild, message.author.id);
        
        // Obter informações do backup
        const backupInfo = await backupSystem.getBackupInfo(message.guild.id);
        
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Backup Criado com Sucesso!')
            .setColor('#00ff00')
            .addFields(
                { name: '📁 Canais Salvos', value: backupInfo.channels.toString(), inline: true },
                { name: '👑 Cargos Salvos', value: backupInfo.roles.toString(), inline: true },
                { name: '⏰ Criado em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'Backup salvo no banco de dados' })
            .setTimestamp();
        
        await loadingMessage.edit({ embeds: [successEmbed] });
        
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Erro ao Criar Backup')
            .setDescription(`\`\`\`${error.message}\`\`\``)
            .setColor('#ff0000')
            .setTimestamp();
        
        await message.reply({ embeds: [errorEmbed] });
    }
}

async function handleRestoreBackup(message, args, client) {
    // Confirmação adicional para restore
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirmação de Restore')
        .setDescription('**ATENÇÃO:** O restore irá recriar canais e cargos que não existem mais.\n\nEsta ação não pode ser desfeita. Tem certeza que deseja continuar?')
        .setColor('#ff8c00')
        .addFields(
            { name: '✅ Para confirmar', value: 'Digite: `.backup restore confirm`' },
            { name: '❌ Para cancelar', value: 'Ignore esta mensagem' }
        )
        .setTimestamp();
    
    if (args[0] !== 'confirm') {
        return message.reply({ embeds: [confirmEmbed] });
    }
    
    try {
        const loadingEmbed = new EmbedBuilder()
            .setTitle('🔄 Restaurando Backup...')
            .setDescription('Por favor aguarde, este processo pode demorar vários minutos.')
            .setColor('#ffa500')
            .setTimestamp();
        
        const loadingMessage = await message.reply({ embeds: [loadingEmbed] });
        
        // Restaurar backup
        const results = await backupSystem.restoreFromBackup(message.guild, message.author.id);
        
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Restore Concluído!')
            .setColor('#00ff00')
            .addFields(
                { name: '📁 Canais', value: `✅ ${results.channels.created} criados\n❌ ${results.channels.failed} falharam`, inline: true },
                { name: '👑 Cargos', value: `✅ ${results.roles.created} criados\n❌ ${results.roles.failed} falharam`, inline: true },
                { name: '⏰ Concluído em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: 'Restore finalizado' })
            .setTimestamp();
        
        await loadingMessage.edit({ embeds: [successEmbed] });
        
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Erro ao Restaurar Backup')
            .setDescription(`\`\`\`${error.message}\`\`\``)
            .setColor('#ff0000')
            .setTimestamp();
        
        await message.reply({ embeds: [errorEmbed] });
    }
}

async function handleBackupInfo(message, client) {
    try {
        const backupInfo = await backupSystem.getBackupInfo(message.guild.id);
        const embed = backupSystem.createBackupEmbed(message.guild, backupInfo);
        
        if (backupInfo.channels === 0 && backupInfo.roles === 0) {
            embed.setDescription('❌ Nenhum backup encontrado para este servidor.\n\nUse `.backup criar` para criar um backup.');
        }
        
        await message.reply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Erro ao obter informações do backup:', error);
        await message.reply({ content: '❌ Erro ao obter informações do backup.' });
    }
}

async function showBackupHelp(message) {
    const helpEmbed = new EmbedBuilder()
        .setTitle('📦 Sistema de Backup & Restore')
        .setDescription('Sistema profissional de backup para proteger seu servidor contra raids e nukes.')
        .setColor('#2b2d31')
        .addFields(
            {
                name: '📋 Comandos Disponíveis',
                value: '`.backup criar` - Criar backup completo\n`.backup restaurar` - Restaurar backup\n`.backup info` - Ver informações do backup'
            },
            {
                name: '💾 O que é salvo?',
                value: '• Todos os canais (nome, tipo, categoria, posição)\n• Todas as permissões de canais\n• Todos os cargos (nome, cor, permissões, posição)'
            },
            {
                name: '⚠️ Importante',
                value: '• O backup sobrescreve dados anteriores\n• O restore só cria itens que não existem\n• Apenas administradores podem usar'
            }
        )
        .setFooter({ text: 'Use com responsabilidade' })
        .setTimestamp();
    
    await message.reply({ embeds: [helpEmbed] });
}
