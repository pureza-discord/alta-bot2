import { PermissionsBitField, AuditLogEvent } from 'discord.js';
import { SERVER_CONFIG } from '../utils/config.js';
import { Logger } from '../utils/logger.js';

export class AntiRaid {
    constructor(client) {
        this.client = client;
        this.suspiciousActivity = new Map(); // guild_id -> { user_id -> actions[] }
        this.actionThresholds = {
            BAN: 3, // 3 bans em 5 minutos = suspeito
            KICK: 5, // 5 kicks em 5 minutos = suspeito
            CHANNEL_DELETE: 2, // 2 canais deletados em 5 minutos = suspeito
            ROLE_DELETE: 3, // 3 cargos deletados em 5 minutos = suspeito
            CHANNEL_CREATE: 5, // 5 canais criados em 5 minutos = suspeito
            ROLE_CREATE: 5 // 5 cargos criados em 5 minutos = suspeito
        };
        this.timeWindow = 5 * 60 * 1000; // 5 minutos
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Monitorar bans
        this.client.on('guildBanAdd', (ban) => {
            this.handleSuspiciousAction(ban.guild, 'BAN', null, ban.user.id);
        });
        
        // Monitorar kicks através de memberRemove + audit log
        this.client.on('guildMemberRemove', async (member) => {
            try {
                const auditLogs = await member.guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberKick,
                    limit: 1
                });
                
                const kickLog = auditLogs.entries.first();
                if (kickLog && kickLog.target.id === member.id) {
                    this.handleSuspiciousAction(member.guild, 'KICK', kickLog.executor.id, member.id);
                }
            } catch (error) {
                console.error('Erro ao verificar kick no audit log:', error);
            }
        });
        
        // Monitorar deletação de canais
        this.client.on('channelDelete', async (channel) => {
            if (!channel.guild) return;
            
            try {
                const auditLogs = await channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelDelete,
                    limit: 1
                });
                
                const deleteLog = auditLogs.entries.first();
                if (deleteLog && deleteLog.target.id === channel.id) {
                    this.handleSuspiciousAction(channel.guild, 'CHANNEL_DELETE', deleteLog.executor.id, channel.id);
                }
            } catch (error) {
                console.error('Erro ao verificar deletação de canal no audit log:', error);
            }
        });
        
        // Monitorar deletação de cargos
        this.client.on('roleDelete', async (role) => {
            try {
                const auditLogs = await role.guild.fetchAuditLogs({
                    type: AuditLogEvent.RoleDelete,
                    limit: 1
                });
                
                const deleteLog = auditLogs.entries.first();
                if (deleteLog && deleteLog.target.id === role.id) {
                    this.handleSuspiciousAction(role.guild, 'ROLE_DELETE', deleteLog.executor.id, role.id);
                }
            } catch (error) {
                console.error('Erro ao verificar deletação de cargo no audit log:', error);
            }
        });
        
        // Monitorar criação suspeita de canais
        this.client.on('channelCreate', async (channel) => {
            if (!channel.guild) return;
            
            try {
                const auditLogs = await channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelCreate,
                    limit: 1
                });
                
                const createLog = auditLogs.entries.first();
                if (createLog && createLog.target.id === channel.id) {
                    this.handleSuspiciousAction(channel.guild, 'CHANNEL_CREATE', createLog.executor.id, channel.id);
                }
            } catch (error) {
                console.error('Erro ao verificar criação de canal no audit log:', error);
            }
        });
        
        // Monitorar criação suspeita de cargos
        this.client.on('roleCreate', async (role) => {
            try {
                const auditLogs = await role.guild.fetchAuditLogs({
                    type: AuditLogEvent.RoleCreate,
                    limit: 1
                });
                
                const createLog = auditLogs.entries.first();
                if (createLog && createLog.target.id === role.id) {
                    this.handleSuspiciousAction(role.guild, 'ROLE_CREATE', createLog.executor.id, role.id);
                }
            } catch (error) {
                console.error('Erro ao verificar criação de cargo no audit log:', error);
            }
        });
    }
    
    async handleSuspiciousAction(guild, actionType, executorId, targetId) {
        // Ignorar ações do próprio bot
        if (executorId === this.client.user.id) return;
        
        // Verificar se o executor é staff (exceção)
        if (executorId) {
            const executor = await guild.members.fetch(executorId).catch(() => null);
            if (executor) {
                const hasStaffRole = executor.roles.cache.some(role => 
                    SERVER_CONFIG.STAFF_ROLES.includes(role.id)
                );
                
                // Staff ainda pode ser suspeito se exceder muito os limites
                if (hasStaffRole && actionType !== 'BAN' && actionType !== 'KICK') {
                    return;
                }
            }
        }
        
        const guildId = guild.id;
        const now = Date.now();
        
        // Inicializar estrutura se necessário
        if (!this.suspiciousActivity.has(guildId)) {
            this.suspiciousActivity.set(guildId, new Map());
        }
        
        const guildActivity = this.suspiciousActivity.get(guildId);
        
        if (!guildActivity.has(executorId)) {
            guildActivity.set(executorId, []);
        }
        
        const userActions = guildActivity.get(executorId);
        
        // Remover ações antigas (fora da janela de tempo)
        const recentActions = userActions.filter(action => 
            now - action.timestamp < this.timeWindow
        );
        
        // Adicionar nova ação
        recentActions.push({
            type: actionType,
            timestamp: now,
            targetId: targetId
        });
        
        guildActivity.set(executorId, recentActions);
        
        // Contar ações do mesmo tipo
        const sameTypeActions = recentActions.filter(action => action.type === actionType);
        const threshold = this.actionThresholds[actionType];
        
        // Se excedeu o limite, aplicar punição
        if (sameTypeActions.length >= threshold) {
            await this.applyAntiRaidPunishment(guild, executorId, actionType, sameTypeActions.length);
        }
        
        // Log do evento suspeito
        await Logger.logRaidEvent(guildId, executorId, actionType, targetId);
    }
    
    async applyAntiRaidPunishment(guild, userId, actionType, count) {
        try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return;
            
            // Determinar punição baseada no tipo e quantidade de ações
            let punishment = this.determinePunishment(actionType, count);
            
            // Aplicar punição
            await this.executePunishment(guild, member, punishment, actionType);
            
            // Notificar staff
            await this.notifyStaff(guild, member, actionType, count, punishment);
            
            // Se for muito crítico, fazer lockdown temporário
            if (count >= 10 || actionType === 'BAN') {
                await this.emergencyLockdown(guild, member, actionType);
            }
            
            console.log(`🚨 Anti-Raid: ${member.user.tag} punido por ${actionType} (${count}x)`);
            
        } catch (error) {
            console.error('Erro ao aplicar punição anti-raid:', error);
        }
    }
    
    determinePunishment(actionType, count) {
        // Punições mais severas para ações mais perigosas
        const severityMap = {
            'BAN': 3,
            'ROLE_DELETE': 3,
            'CHANNEL_DELETE': 2,
            'KICK': 2,
            'ROLE_CREATE': 1,
            'CHANNEL_CREATE': 1
        };
        
        const severity = severityMap[actionType] || 1;
        const totalSeverity = severity * count;
        
        if (totalSeverity >= 10) return 'BAN';
        if (totalSeverity >= 7) return 'KICK';
        if (totalSeverity >= 5) return 'TIMEOUT_LONG';
        return 'TIMEOUT_SHORT';
    }
    
    async executePunishment(guild, member, punishment, reason) {
        const punishmentReason = `Anti-Raid: Atividade suspeita (${reason})`;
        
        switch (punishment) {
            case 'BAN':
                if (member.bannable) {
                    await member.ban({ reason: punishmentReason });
                }
                break;
                
            case 'KICK':
                if (member.kickable) {
                    await member.kick(punishmentReason);
                }
                break;
                
            case 'TIMEOUT_LONG':
                if (member.moderatable) {
                    await member.timeout(24 * 60 * 60 * 1000, punishmentReason); // 24 horas
                }
                break;
                
            case 'TIMEOUT_SHORT':
                if (member.moderatable) {
                    await member.timeout(60 * 60 * 1000, punishmentReason); // 1 hora
                }
                break;
        }
        
        // Remover cargos perigosos se ainda não foi banido/kickado
        if (punishment.includes('TIMEOUT') && member.guild) {
            await this.removeHighPermissionRoles(member);
        }
    }
    
    async removeHighPermissionRoles(member) {
        try {
            const dangerousPermissions = [
                PermissionsBitField.Flags.Administrator,
                PermissionsBitField.Flags.ManageGuild,
                PermissionsBitField.Flags.ManageRoles,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.BanMembers,
                PermissionsBitField.Flags.KickMembers
            ];
            
            const rolesToRemove = member.roles.cache.filter(role => 
                dangerousPermissions.some(perm => role.permissions.has(perm))
            );
            
            for (const role of rolesToRemove.values()) {
                if (role.position < member.guild.members.me.roles.highest.position) {
                    await member.roles.remove(role, 'Anti-Raid: Remoção de permissões perigosas');
                }
            }
        } catch (error) {
            console.error('Erro ao remover cargos perigosos:', error);
        }
    }
    
    async notifyStaff(guild, member, actionType, count, punishment) {
        // Encontrar canal de logs ou criar embed para staff
        const embed = Logger.createRaidEmbed(member.user, `${actionType} (${count}x) - ${punishment}`);
        
        // Tentar encontrar um canal de logs ou mandar para o canal geral
        const logChannel = guild.channels.cache.find(c => 
            c.name.includes('log') || c.name.includes('mod')
        ) || guild.systemChannel;
        
        if (logChannel) {
            await logChannel.send({ 
                content: '@here **ALERTA ANTI-RAID**',
                embeds: [embed] 
            }).catch(() => {});
        }
    }
    
    async emergencyLockdown(guild, member, actionType) {
        try {
            // Lockdown temporário do servidor (apenas para ações muito críticas)
            const everyone = guild.roles.everyone;
            
            // Remover permissão de enviar mensagens temporariamente
            const channels = guild.channels.cache.filter(c => c.type === 0); // TEXT channels
            
            for (const channel of channels.values()) {
                await channel.permissionOverwrites.edit(everyone, {
                    SendMessages: false
                }, 'Emergency lockdown - Anti-Raid').catch(() => {});
            }
            
            // Agendar remoção do lockdown em 10 minutos
            setTimeout(async () => {
                for (const channel of channels.values()) {
                    await channel.permissionOverwrites.edit(everyone, {
                        SendMessages: null // Volta ao padrão
                    }, 'Lockdown removido automaticamente').catch(() => {});
                }
                console.log(`🔓 Lockdown removido automaticamente em ${guild.name}`);
            }, 10 * 60 * 1000);
            
            console.log(`🔒 Lockdown de emergência ativado em ${guild.name} por ${actionType}`);
            
        } catch (error) {
            console.error('Erro ao aplicar lockdown de emergência:', error);
        }
    }
    
    // Método para limpar dados antigos (executar periodicamente)
    cleanupOldData() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        for (const [guildId, guildActivity] of this.suspiciousActivity.entries()) {
            for (const [userId, actions] of guildActivity.entries()) {
                const recentActions = actions.filter(action => 
                    now - action.timestamp < maxAge
                );
                
                if (recentActions.length === 0) {
                    guildActivity.delete(userId);
                } else {
                    guildActivity.set(userId, recentActions);
                }
            }
            
            if (guildActivity.size === 0) {
                this.suspiciousActivity.delete(guildId);
            }
        }
    }
}
