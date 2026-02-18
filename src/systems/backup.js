import { PermissionsBitField, ChannelType } from 'discord.js';
import { buildEmbed } from '../utils/embed.js';
import { prisma } from '../services/prisma.js';
import { Logger } from '../utils/logger.js';

export class BackupSystem {
    constructor() {
        this.isBackupRunning = new Set(); // guild_ids com backup em andamento
        this.isRestoreRunning = new Set(); // guild_ids com restore em andamento
    }
    
    async createBackup(guild, initiatorId) {
        if (this.isBackupRunning.has(guild.id)) {
            throw new Error('Backup já está em andamento para este servidor');
        }
        
        this.isBackupRunning.add(guild.id);
        
        try {
            console.log(`📦 Iniciando backup do servidor ${guild.name}`);
            
            // Backup dos canais
            await this.backupChannels(guild);
            
            // Backup dos cargos
            await this.backupRoles(guild);
            
            // Log da ação
            await Logger.logModeration(
                guild.id,
                guild.id,
                initiatorId,
                'BACKUP_CREATE',
                'Backup completo do servidor'
            );
            
            console.log(`✅ Backup concluído para ${guild.name}`);
            return true;
            
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            throw error;
        } finally {
            this.isBackupRunning.delete(guild.id);
        }
    }
    
    async backupChannels(guild) {
        const channels = guild.channels.cache;
        let backedUpCount = 0;

        await prisma.channelBackup.deleteMany({ where: { guildId: guild.id } });
        
        for (const [channelId, channel] of channels) {
            try {
                const permissions = channel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                }));

                await prisma.channelBackup.create({
                    data: {
                        guildId: guild.id,
                        channelId,
                        name: channel.name,
                        type: channel.type,
                        categoryId: channel.parentId,
                        position: channel.position,
                        permissions
                    }
                });
                
                backedUpCount++;
            } catch (error) {
                console.error(`Erro ao fazer backup do canal ${channel.name}:`, error);
            }
        }
        
        console.log(`📁 ${backedUpCount} canais salvos no backup`);
    }
    
    async backupRoles(guild) {
        const roles = guild.roles.cache;
        let backedUpCount = 0;

        await prisma.roleBackup.deleteMany({ where: { guildId: guild.id } });
        
        for (const [roleId, role] of roles) {
            // Pular o cargo @everyone
            if (roleId === guild.id) continue;
            
            try {
                await prisma.roleBackup.create({
                    data: {
                        guildId: guild.id,
                        roleId,
                        name: role.name,
                        color: role.color,
                        permissions: role.permissions.bitfield.toString(),
                        position: role.position,
                        mentionable: role.mentionable,
                        hoist: role.hoist
                    }
                });
                
                backedUpCount++;
            } catch (error) {
                console.error(`Erro ao fazer backup do cargo ${role.name}:`, error);
            }
        }
        
        console.log(`👑 ${backedUpCount} cargos salvos no backup`);
    }
    
    async restoreFromBackup(guild, initiatorId, options = {}) {
        if (this.isRestoreRunning.has(guild.id)) {
            throw new Error('Restore já está em andamento para este servidor');
        }
        
        this.isRestoreRunning.add(guild.id);
        
        try {
            console.log(`🔄 Iniciando restore do servidor ${guild.name}`);
            
            const results = {
                channels: { created: 0, failed: 0 },
                roles: { created: 0, failed: 0 }
            };
            
            // Restore dos cargos (primeiro, pois canais podem depender deles)
            if (options.restoreRoles !== false) {
                const roleResults = await this.restoreRoles(guild);
                results.roles = roleResults;
            }
            
            // Restore dos canais
            if (options.restoreChannels !== false) {
                const channelResults = await this.restoreChannels(guild);
                results.channels = channelResults;
            }
            
            // Log da ação
            await Logger.logModeration(
                guild.id,
                guild.id,
                initiatorId,
                'BACKUP_RESTORE',
                `Restore: ${results.channels.created} canais, ${results.roles.created} cargos`
            );
            
            console.log(`✅ Restore concluído para ${guild.name}`);
            return results;
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            throw error;
        } finally {
            this.isRestoreRunning.delete(guild.id);
        }
    }
    
    async restoreRoles(guild) {
        const results = { created: 0, failed: 0 };

        const roleBackups = await prisma.roleBackup.findMany({
            where: { guildId: guild.id },
            orderBy: { position: "desc" }
        });
        
        if (roleBackups.length === 0) {
            console.log('❌ Nenhum backup de cargos encontrado');
            return results;
        }
        
        for (const roleBackup of roleBackups) {
            try {
                // Verificar se o cargo já existe
                const existingRole = guild.roles.cache.get(roleBackup.roleId);
                if (existingRole) continue;
                
                // Criar o cargo
                const createdRole = await guild.roles.create({
                    name: roleBackup.name,
                    color: roleBackup.color,
                    permissions: BigInt(roleBackup.permissions),
                    mentionable: roleBackup.mentionable,
                    hoist: roleBackup.hoist,
                    reason: 'Restore de backup'
                });
                
                results.created++;
                console.log(`✅ Cargo restaurado: ${roleBackup.name}`);
                
                // Pequena pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Erro ao restaurar cargo ${roleBackup.name}:`, error);
                results.failed++;
            }
        }
        
        return results;
    }
    
    async restoreChannels(guild) {
        const results = { created: 0, failed: 0 };

        const channelBackups = await prisma.channelBackup.findMany({
            where: { guildId: guild.id },
            orderBy: { position: "asc" }
        });
        
        if (channelBackups.length === 0) {
            console.log('❌ Nenhum backup de canais encontrado');
            return results;
        }
        
        // Separar categorias e canais normais
        const categories = channelBackups.filter(ch => ch.type === ChannelType.GuildCategory);
        const channels = channelBackups.filter(ch => ch.type !== ChannelType.GuildCategory);
        
        // Criar categorias primeiro
        for (const categoryBackup of categories) {
            try {
                const existingCategory = guild.channels.cache.get(categoryBackup.channelId);
                if (existingCategory) continue;
                
                await guild.channels.create({
                    name: categoryBackup.name,
                    type: ChannelType.GuildCategory,
                    position: categoryBackup.position,
                    reason: 'Restore de backup'
                });
                
                results.created++;
                console.log(`✅ Categoria restaurada: ${categoryBackup.name}`);
                
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Erro ao restaurar categoria ${categoryBackup.name}:`, error);
                results.failed++;
            }
        }
        
        // Criar canais normais
        for (const channelBackup of channels) {
            try {
                const existingChannel = guild.channels.cache.get(channelBackup.channelId);
                if (existingChannel) continue;
                
                const parent = channelBackup.categoryId ?
                    guild.channels.cache.get(channelBackup.categoryId) : null;
                
                const channelOptions = {
                    name: channelBackup.name,
                    type: channelBackup.type,
                    parent: parent,
                    position: channelBackup.position,
                    reason: 'Restore de backup'
                };
                
                const createdChannel = await guild.channels.create(channelOptions);
                
                // Restaurar permissões se existirem
                if (channelBackup.permissions) {
                    try {
                        const permissions = channelBackup.permissions;
                        for (const perm of permissions) {
                            const target = perm.type === 0 ? 
                                guild.roles.cache.get(perm.id) : 
                                await guild.members.fetch(perm.id).catch(() => null);
                            
                            if (target) {
                                await createdChannel.permissionOverwrites.create(target, {
                                    ...Object.fromEntries(perm.allow.map(p => [p, true])),
                                    ...Object.fromEntries(perm.deny.map(p => [p, false]))
                                });
                            }
                        }
                    } catch (permError) {
                        console.error('Erro ao restaurar permissões do canal:', permError);
                    }
                }
                
                results.created++;
                console.log(`✅ Canal restaurado: ${channelBackup.name}`);
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.error(`❌ Erro ao restaurar canal ${channelBackup.name}:`, error);
                results.failed++;
            }
        }
        
        return results;
    }
    
    async getBackupInfo(guildId) {
        const channelCount = await prisma.channelBackup.count({ where: { guildId } });
        const roleCount = await prisma.roleBackup.count({ where: { guildId } });
        const lastBackup = await prisma.channelBackup.findFirst({
            where: { guildId },
            orderBy: { createdAt: "desc" }
        });
        
        return {
            channels: channelCount,
            roles: roleCount,
            lastBackup: lastBackup?.createdAt || null
        };
    }
    
    createBackupEmbed(guild, info) {
        const embed = buildEmbed({
            title: '📦 Informações do Backup',
            description: 'Resumo do último backup registrado.',
            fields: [
                { name: '🏛️ Servidor', value: guild.name, inline: true },
                { name: '📁 Canais', value: info.channels.toString(), inline: true },
                { name: '👑 Cargos', value: info.roles.toString(), inline: true }
            ]
        });
        
        if (info.lastBackup) {
            embed.addFields({
                name: '⏰ Último Backup',
                value: `<t:${Math.floor(info.lastBackup.getTime() / 1000)}:R>`,
                inline: true
            });
        }
        
        return embed;
    }
}
