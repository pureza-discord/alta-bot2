import { PermissionsBitField } from 'discord.js';
import { buildEmbed } from '../utils/embed.js';
import { SERVER_CONFIG } from '../utils/config.js';
import { Logger } from '../utils/logger.js';

export class AutoMod {
    constructor() {
        this.userMessageCount = new Map(); // user_id -> { count, lastReset }
        this.userWarnings = new Map(); // user_id -> warning_count
        this.spamThreshold = 5; // mensagens por intervalo
        this.spamInterval = 5000; // 5 segundos
        this.linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        this.blacklistedWords = [
            // Adicione palavras proibidas aqui
            'spam', 'raid', 'hack', 'scam'
        ];
    }
    
    async checkMessage(message) {
        // Ignorar bots
        if (message.author.bot) return false;
        
        // Verificar se o usuário tem cargo de staff (exceção)
        const member = message.member;
        if (!member) return false;
        
        const hasStaffRole = member.roles.cache.some(role => 
            SERVER_CONFIG.STAFF_ROLES.includes(role.id)
        );
        
        if (hasStaffRole) return false;
        
        // Verificar diferentes tipos de infrações
        const infractions = [];
        
        // 1. Verificar spam/flood
        if (this.checkSpam(message)) {
            infractions.push('SPAM');
        }
        
        // 2. Verificar links suspeitos
        if (this.checkSuspiciousLinks(message)) {
            infractions.push('SUSPICIOUS_LINK');
        }
        
        // 3. Verificar palavras proibidas
        if (this.checkBlacklistedWords(message)) {
            infractions.push('BLACKLISTED_WORD');
        }
        
        // 4. Verificar mentions em massa
        if (this.checkMassMentions(message)) {
            infractions.push('MASS_MENTION');
        }
        
        // Se houver infrações, aplicar punição
        if (infractions.length > 0) {
            await this.applyPunishment(message, infractions);
            return true;
        }
        
        return false;
    }
    
    checkSpam(message) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (!this.userMessageCount.has(userId)) {
            this.userMessageCount.set(userId, { count: 1, lastReset: now });
            return false;
        }
        
        const userData = this.userMessageCount.get(userId);
        
        // Reset contador se passou do intervalo
        if (now - userData.lastReset > this.spamInterval) {
            userData.count = 1;
            userData.lastReset = now;
            return false;
        }
        
        userData.count++;
        
        // Se excedeu o limite, é spam
        return userData.count > this.spamThreshold;
    }
    
    checkSuspiciousLinks(message) {
        const links = message.content.match(this.linkRegex);
        if (!links) return false;
        
        // Lista de domínios suspeitos/perigosos
        const suspiciousDomains = [
            'discord.gg', 'discordapp.com', 'discord.com',
            'bit.ly', 'tinyurl.com', 'shorturl.at',
            'grabify.link', 'iplogger.org'
        ];
        
        for (const link of links) {
            for (const domain of suspiciousDomains) {
                if (link.includes(domain) && !this.isWhitelistedLink(link)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    isWhitelistedLink(link) {
        // Links do próprio servidor ou links permitidos
        const whitelistedDomains = [
            'youtube.com', 'youtu.be', 'twitch.tv',
            'github.com', 'stackoverflow.com'
        ];
        
        return whitelistedDomains.some(domain => link.includes(domain));
    }
    
    checkBlacklistedWords(message) {
        const content = message.content.toLowerCase();
        return this.blacklistedWords.some(word => 
            content.includes(word.toLowerCase())
        );
    }
    
    checkMassMentions(message) {
        // Verificar @everyone, @here
        if (message.content.includes('@everyone') || message.content.includes('@here')) {
            return true;
        }
        
        // Verificar muitas menções de usuários
        const userMentions = message.mentions.users.size;
        const roleMentions = message.mentions.roles.size;
        
        return (userMentions + roleMentions) > 5;
    }
    
    async applyPunishment(message, infractions) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        try {
            // Deletar mensagem
            await message.delete().catch(() => {});
            
            // Incrementar warnings
            const currentWarnings = this.userWarnings.get(userId) || 0;
            const newWarnings = currentWarnings + 1;
            this.userWarnings.set(userId, newWarnings);
            
            // Determinar punição baseada no número de warnings
            let punishment = 'WARN';
            let duration = null;
            
            if (newWarnings >= 3) {
                punishment = 'TIMEOUT';
                duration = 300; // 5 minutos
            }
            if (newWarnings >= 5) {
                punishment = 'TIMEOUT';
                duration = 1800; // 30 minutos
            }
            if (newWarnings >= 8) {
                punishment = 'KICK';
            }
            if (newWarnings >= 10) {
                punishment = 'BAN';
            }
            
            // Aplicar punição
            await this.executePunishment(message, punishment, duration);
            
            // Log da infração
            for (const infraction of infractions) {
                await Logger.logAutomod(guildId, userId, infraction, message.content);
            }
            
            // Enviar notificação para o usuário
            await this.sendUserNotification(message, infractions, punishment, newWarnings);
            
            console.log(`🤖 AutoMod: ${message.author.tag} punido por: ${infractions.join(', ')}`);
            
        } catch (error) {
            console.error('Erro ao aplicar punição do AutoMod:', error);
        }
    }
    
    async executePunishment(message, punishment, duration = null) {
        const member = message.member;
        
        switch (punishment) {
            case 'TIMEOUT':
                if (duration && member.moderatable) {
                    await member.timeout(duration * 1000, 'AutoMod - Infrações múltiplas');
                }
                break;
                
            case 'KICK':
                if (member.kickable) {
                    await member.kick('AutoMod - Infrações excessivas');
                }
                break;
                
            case 'BAN':
                if (member.bannable) {
                    await member.ban({ reason: 'AutoMod - Infrações críticas' });
                }
                break;
        }
    }
    
    async sendUserNotification(message, infractions, punishment, warningCount) {
        try {
            const embed = buildEmbed({
                title: '🤖 AutoMod — Infração Detectada',
                description: 'Sua mensagem foi removida por violar as regras do servidor.',
                fields: [
                    { name: '🚫 Infrações', value: infractions.join(', '), inline: true },
                    { name: '⚠️ Warnings', value: `${warningCount}/10`, inline: true },
                    { name: '⚡ Ação', value: punishment, inline: true }
                ]
            });
            
            await message.author.send({ embeds: [embed] }).catch(() => {
                // Se não conseguir enviar DM, enviar no canal (ephemeral se possível)
            });
            
        } catch (error) {
            console.log('Não foi possível enviar notificação para o usuário');
        }
    }
    
    // Método para resetar warnings de um usuário (comando manual)
    resetWarnings(userId) {
        this.userWarnings.delete(userId);
        this.userMessageCount.delete(userId);
    }
    
    // Método para obter warnings de um usuário
    getUserWarnings(userId) {
        return this.userWarnings.get(userId) || 0;
    }
}
