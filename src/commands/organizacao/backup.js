import { PermissionsBitField } from 'discord.js';
import { buildEmbed } from '../../utils/embed.js';
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
        const loadingEmbed = buildEmbed({
            title: '📦 Criando Backup...',
            description: 'Por favor aguarde, este processo pode demorar alguns minutos.',
            fields: [
                { name: '📌 Status', value: '• Processando dados do servidor', inline: false }
            ]
        });
        
        const loadingMessage = await message.reply({ embeds: [loadingEmbed] });
        
        // Criar backup
        await backupSystem.createBackup(message.guild, message.author.id);
        
        // Obter informações do backup
        const backupInfo = await backupSystem.getBackupInfo(message.guild.id);
        
        const successEmbed = buildEmbed({
            title: '✅ Backup Criado com Sucesso!',
            description: 'Backup salvo no banco de dados com segurança.',
            fields: [
                { name: '📁 Canais Salvos', value: backupInfo.channels.toString(), inline: true },
                { name: '👑 Cargos Salvos', value: backupInfo.roles.toString(), inline: true },
                { name: '⏰ Criado em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ]
        });
        
        await loadingMessage.edit({ embeds: [successEmbed] });
        
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        
        const errorEmbed = buildEmbed({
            title: '❌ Erro ao Criar Backup',
            description: 'Ocorreu um erro durante a criação do backup.',
            fields: [
                { name: '🧾 Detalhes', value: `\`\`\`${error.message}\`\`\``, inline: false }
            ]
        });
        
        await message.reply({ embeds: [errorEmbed] });
    }
}

async function handleRestoreBackup(message, args, client) {
    // Confirmação adicional para restore
    const confirmEmbed = buildEmbed({
        title: '⚠️ Confirmação de Restore',
        description: 'Esta ação irá recriar canais e cargos que não existem mais.',
        fields: [
            { name: '⚠️ Importante', value: '• Esta ação não pode ser desfeita', inline: false },
            { name: '✅ Para confirmar', value: 'Digite: `.backup restore confirm`', inline: false },
            { name: '❌ Para cancelar', value: 'Ignore esta mensagem', inline: false }
        ]
    });
    
    if (args[0] !== 'confirm') {
        return message.reply({ embeds: [confirmEmbed] });
    }
    
    try {
        const loadingEmbed = buildEmbed({
            title: '🔄 Restaurando Backup...',
            description: 'Por favor aguarde, este processo pode demorar vários minutos.',
            fields: [
                { name: '📌 Status', value: '• Restaurando canais e cargos', inline: false }
            ]
        });
        
        const loadingMessage = await message.reply({ embeds: [loadingEmbed] });
        
        // Restaurar backup
        const results = await backupSystem.restoreFromBackup(message.guild, message.author.id);
        
        const successEmbed = buildEmbed({
            title: '✅ Restore Concluído!',
            description: 'Processo finalizado com os resultados abaixo.',
            fields: [
                { name: '📁 Canais', value: `✅ ${results.channels.created} criados\n❌ ${results.channels.failed} falharam`, inline: true },
                { name: '👑 Cargos', value: `✅ ${results.roles.created} criados\n❌ ${results.roles.failed} falharam`, inline: true },
                { name: '⏰ Concluído em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ]
        });
        
        await loadingMessage.edit({ embeds: [successEmbed] });
        
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        
        const errorEmbed = buildEmbed({
            title: '❌ Erro ao Restaurar Backup',
            description: 'Ocorreu um erro durante o restore.',
            fields: [
                { name: '🧾 Detalhes', value: `\`\`\`${error.message}\`\`\``, inline: false }
            ]
        });
        
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
    const helpEmbed = buildEmbed({
        title: '📦 Sistema de Backup & Restore',
        description: 'Sistema profissional de backup para proteger seu servidor contra raids e nukes.',
        fields: [
            {
                name: '📋 Comandos Disponíveis',
                value: '• `.backup criar` - Criar backup completo\n• `.backup restaurar` - Restaurar backup\n• `.backup info` - Ver informações do backup',
                inline: false
            },
            {
                name: '💾 O que é salvo?',
                value: '• Todos os canais (nome, tipo, categoria, posição)\n• Todas as permissões de canais\n• Todos os cargos (nome, cor, permissões, posição)',
                inline: false
            },
            {
                name: '⚠️ Importante',
                value: '• O backup sobrescreve dados anteriores\n• O restore só cria itens que não existem\n• Apenas administradores podem usar',
                inline: false
            }
        ]
    });
    
    await message.reply({ embeds: [helpEmbed] });
}
