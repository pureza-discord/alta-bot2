import { PermissionsBitField, ChannelType } from 'discord.js';
import { buildEmbed } from '../utils/embed.js';
import { db } from '../database.js';
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
        
        // Limpar backups antigos de canais
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM channel_backups WHERE guild_id = ?', [guild.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        for (const [channelId, channel] of channels) {
            try {
                const permissions = channel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                }));
                
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO channel_backups 
                         (guild_id, channel_id, channel_name, channel_type, category_id, position, permissions)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            guild.id,
                            channelId,
                            channel.name,
                            channel.type,
                            channel.parentId,
                            channel.position,
                            JSON.stringify(permissions)
                        ],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
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
        
        // Limpar backups antigos de cargos
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM role_backups WHERE guild_id = ?', [guild.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        for (const [roleId, role] of roles) {
            // Pular o cargo @everyone
            if (roleId === guild.id) continue;
            
            try {
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO role_backups 
                         (guild_id, role_id, role_name, color, permissions, position, mentionable, hoist)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            guild.id,
                            roleId,
                            role.name,
                            role.color,
                            role.permissions.bitfield.toString(),
                            role.position,
                            role.mentionable ? 1 : 0,
                            role.hoist ? 1 : 0
                        ],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
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
        
        // Buscar backup dos cargos
        const roleBackups = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM role_backups WHERE guild_id = ? ORDER BY position DESC',
                [guild.id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
        
        if (roleBackups.length === 0) {
            console.log('❌ Nenhum backup de cargos encontrado');
            return results;
        }
        
        for (const roleBackup of roleBackups) {
            try {
                // Verificar se o cargo já existe
                const existingRole = guild.roles.cache.get(roleBackup.role_id);
                if (existingRole) continue;
                
                // Criar o cargo
                const createdRole = await guild.roles.create({
                    name: roleBackup.role_name,
                    color: roleBackup.color,
                    permissions: BigInt(roleBackup.permissions),
                    mentionable: roleBackup.mentionable === 1,
                    hoist: roleBackup.hoist === 1,
                    reason: 'Restore de backup'
                });
                
                results.created++;
                console.log(`✅ Cargo restaurado: ${roleBackup.role_name}`);
                
                // Pequena pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Erro ao restaurar cargo ${roleBackup.role_name}:`, error);
                results.failed++;
            }
        }
        
        return results;
    }
    
    async restoreChannels(guild) {
        const results = { created: 0, failed: 0 };
        
        // Buscar backup dos canais
        const channelBackups = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM channel_backups WHERE guild_id = ? ORDER BY position ASC',
                [guild.id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
        
        if (channelBackups.length === 0) {
            console.log('❌ Nenhum backup de canais encontrado');
            return results;
        }
        
        // Separar categorias e canais normais
        const categories = channelBackups.filter(ch => ch.channel_type === ChannelType.GuildCategory);
        const channels = channelBackups.filter(ch => ch.channel_type !== ChannelType.GuildCategory);
        
        // Criar categorias primeiro
        for (const categoryBackup of categories) {
            try {
                const existingCategory = guild.channels.cache.get(categoryBackup.channel_id);
                if (existingCategory) continue;
                
                await guild.channels.create({
                    name: categoryBackup.channel_name,
                    type: ChannelType.GuildCategory,
                    position: categoryBackup.position,
                    reason: 'Restore de backup'
                });
                
                results.created++;
                console.log(`✅ Categoria restaurada: ${categoryBackup.channel_name}`);
                
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Erro ao restaurar categoria ${categoryBackup.channel_name}:`, error);
                results.failed++;
            }
        }
        
        // Criar canais normais
        for (const channelBackup of channels) {
            try {
                const existingChannel = guild.channels.cache.get(channelBackup.channel_id);
                if (existingChannel) continue;
                
                const parent = channelBackup.category_id ? 
                    guild.channels.cache.get(channelBackup.category_id) : null;
                
                const channelOptions = {
                    name: channelBackup.channel_name,
                    type: channelBackup.channel_type,
                    parent: parent,
                    position: channelBackup.position,
                    reason: 'Restore de backup'
                };
                
                const createdChannel = await guild.channels.create(channelOptions);
                
                // Restaurar permissões se existirem
                if (channelBackup.permissions) {
                    try {
                        const permissions = JSON.parse(channelBackup.permissions);
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
                console.log(`✅ Canal restaurado: ${channelBackup.channel_name}`);
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.error(`❌ Erro ao restaurar canal ${channelBackup.channel_name}:`, error);
                results.failed++;
            }
        }
        
        return results;
    }
    
    async getBackupInfo(guildId) {
        const channelCount = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as count FROM channel_backups WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.count || 0);
                }
            );
        });
        
        const roleCount = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as count FROM role_backups WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.count || 0);
                }
            );
        });
        
        const lastBackup = await new Promise((resolve, reject) => {
            db.get(
                'SELECT MAX(created_at) as last_backup FROM channel_backups WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.last_backup);
                }
            );
        });
        
        return {
            channels: channelCount,
            roles: roleCount,
            lastBackup: lastBackup ? new Date(lastBackup * 1000) : null
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
