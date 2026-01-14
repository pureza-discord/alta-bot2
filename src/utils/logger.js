import { EmbedBuilder } from 'discord.js';
import { db } from '../database.js';

export class Logger {
    static async logModeration(guildId, userId, moderatorId, action, reason = null, duration = null) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO moderation_logs 
                 (guild_id, user_id, moderator_id, action, reason, duration)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [guildId, userId, moderatorId, action, reason, duration],
                function(err) {
                    if (err) {
                        console.error('Erro ao salvar log de moderação:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }
    
    static async logAutomod(guildId, userId, infractionType, content = null) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO automod_infractions 
                 (guild_id, user_id, infraction_type, content)
                 VALUES (?, ?, ?, ?)`,
                [guildId, userId, infractionType, content],
                function(err) {
                    if (err) {
                        console.error('Erro ao salvar infração do automod:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }
    
    static async logRaidEvent(guildId, userId, eventType, targetId = null) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO raid_events 
                 (guild_id, user_id, event_type, target_id)
                 VALUES (?, ?, ?, ?)`,
                [guildId, userId, eventType, targetId],
                function(err) {
                    if (err) {
                        console.error('Erro ao salvar evento de raid:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }
    
    static createModerationEmbed(action, user, moderator, reason, duration = null) {
        const colors = {
            'ban': '#ff0000',
            'kick': '#ff8c00',
            'timeout': '#ffa500',
            'warn': '#ffff00',
            'unmute': '#00ff00',
            'untimeout': '#00ff00'
        };
        
        const icons = {
            'ban': '🔨',
            'kick': '👢',
            'timeout': '⏰',
            'warn': '⚠️',
            'unmute': '🔊',
            'untimeout': '⏰'
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`${icons[action] || '⚡'} ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .setColor(colors[action] || '#2b2d31')
            .addFields(
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '👮 Moderador', value: `${moderator.tag}`, inline: true },
                { name: '📝 Motivo', value: reason || 'Sem motivo fornecido', inline: false }
            )
            .setTimestamp();
            
        if (duration) {
            embed.addFields({ name: '⏱️ Duração', value: this.formatDuration(duration), inline: true });
        }
        
        return embed;
    }
    
    static createAutomodEmbed(user, infractionType, content = null) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 AutoMod - Infração Detectada')
            .setColor('#ff6b6b')
            .addFields(
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🚫 Tipo', value: infractionType, inline: true },
                { name: '⏰ Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();
            
        if (content) {
            embed.addFields({ name: '📝 Conteúdo', value: `\`\`\`${content.substring(0, 1000)}\`\`\``, inline: false });
        }
        
        return embed;
    }
    
    static createRaidEmbed(user, eventType, targetId = null) {
        const embed = new EmbedBuilder()
            .setTitle('🚨 Anti-Raid - Atividade Suspeita')
            .setColor('#dc2626')
            .addFields(
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🎯 Evento', value: eventType, inline: true },
                { name: '⏰ Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();
            
        if (targetId) {
            embed.addFields({ name: '🎯 Alvo', value: targetId, inline: true });
        }
        
        return embed;
    }
    
    static formatDuration(seconds) {
        const units = [
            { name: 'd', value: 86400 },
            { name: 'h', value: 3600 },
            { name: 'm', value: 60 },
            { name: 's', value: 1 }
        ];
        
        const parts = [];
        for (const unit of units) {
            const count = Math.floor(seconds / unit.value);
            if (count > 0) {
                parts.push(`${count}${unit.name}`);
                seconds %= unit.value;
            }
        }
        
        return parts.join(' ') || '0s';
    }
}
