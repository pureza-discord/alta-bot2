import fs from "fs";
import path from "path";
import chalk from "chalk";
import winston from "winston";
import { buildEmbed, DEFAULT_EMBED_COLOR } from "./embed.js";
import { logAudit } from "../services/core/auditLogService.js";
import { sendAlert } from "./alerts.js";

const LOGS_DIR = path.resolve("logs");
const LOG_FILE = path.join(LOGS_DIR, "app.log");

if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: LOG_FILE }),
        new winston.transports.Console()
    ]
});

function ensureLogFile() {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, "");
    }
}

function formatTimestamp(date = new Date()) {
    const pad = (value) => String(value).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function writeLogToFile(level, message, meta) {
    ensureLogFile();
    const timestamp = formatTimestamp();
    const metaText = meta ? ` | ${JSON.stringify(meta)}` : "";
    const line = `[${timestamp}] [${level}] ${message}${metaText}\n`;
    fs.appendFile(LOG_FILE, line, (err) => {
        if (err) {
            console.error("Erro ao salvar log no arquivo:", err);
        }
    });
}

function logToConsole(level, colorFn, message, meta) {
    const timestamp = formatTimestamp();
    const metaText = meta ? ` ${chalk.gray(JSON.stringify(meta))}` : "";
    const line = `${chalk.gray(`[${timestamp}]`)} ${colorFn(level)} ${message}${metaText}`;
    if (level === "ERROR") {
        console.error(line);
    } else {
        console.log(line);
    }
}

export function info(message, meta = null) {
    logToConsole("INFO", chalk.cyan, message, meta);
    writeLogToFile("INFO", message, meta);
    logger.info(message, meta || undefined);
}

export function warn(message, meta = null) {
    logToConsole("WARN", chalk.yellow, message, meta);
    writeLogToFile("WARN", message, meta);
    logger.warn(message, meta || undefined);
}

export function error(message, meta = null) {
    logToConsole("ERROR", chalk.red, message, meta);
    writeLogToFile("ERROR", message, meta);
    logger.error(message, meta || undefined);
}

export function success(message, meta = null) {
    logToConsole("SUCCESS", chalk.green, message, meta);
    writeLogToFile("SUCCESS", message, meta);
    logger.info(message, meta || undefined);
}

export function registerGlobalErrorHandlers() {
    process.on("unhandledRejection", (reason) => {
        error("Unhandled Promise Rejection", { reason });
        sendAlert("Unhandled Promise Rejection", "Erro não tratado em Promise", { reason });
    });
    process.on("uncaughtException", (err) => {
        error("Uncaught Exception", { message: err.message, stack: err.stack });
        sendAlert("Uncaught Exception", "Erro não capturado", { message: err.message, stack: err.stack });
    });
}

export class Logger {
    static async logModeration(guildId, userId, moderatorId, action, reason = null, duration = null) {
        await logAudit({
            guildId,
            action: `moderation.${action}`,
            actorId: moderatorId,
            targetId: userId,
            source: "moderation",
            severity: action === "ban" ? "warn" : "info",
            meta: { reason, duration }
        });
        return true;
    }
    
    static async logAutomod(guildId, userId, infractionType, content = null) {
        await logAudit({
            guildId,
            action: "automod.infraction",
            actorId: null,
            targetId: userId,
            source: "automod",
            severity: "warn",
            meta: { infractionType, content }
        });
        return true;
    }
    
    static async logRaidEvent(guildId, userId, eventType, targetId = null) {
        await logAudit({
            guildId,
            action: "antiraid.event",
            actorId: null,
            targetId: userId,
            source: "antiraid",
            severity: "warn",
            meta: { eventType, targetId }
        });
        return true;
    }
    
    static createModerationEmbed(action, user, moderator, reason, duration = null) {
        const icons = {
            'ban': '🔨',
            'kick': '👢',
            'timeout': '⏰',
            'warn': '⚠️',
            'unmute': '🔊',
            'untimeout': '⏰'
        };
        const actionTitle = `${icons[action] || '⚡'} ${action.charAt(0).toUpperCase() + action.slice(1)}`;
        const embed = buildEmbed({
            title: actionTitle,
            description: 'Registro oficial de moderação.',
            fields: [
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '👮 Moderador', value: `${moderator.tag}`, inline: true },
                { name: '📝 Motivo', value: reason || 'Sem motivo fornecido', inline: false }
            ],
            color: DEFAULT_EMBED_COLOR
        });
            
        if (duration) {
            embed.addFields({ name: '⏱️ Duração', value: this.formatDuration(duration), inline: true });
        }
        
        return embed;
    }
    
    static createAutomodEmbed(user, infractionType, content = null) {
        const embed = buildEmbed({
            title: '🤖 AutoMod — Infração Detectada',
            description: 'Ação automática registrada pelo sistema de segurança.',
            fields: [
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🚫 Tipo', value: infractionType, inline: true },
                { name: '⏰ Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            color: DEFAULT_EMBED_COLOR
        });
            
        if (content) {
            embed.addFields({ name: '📝 Conteúdo', value: `\`\`\`${content.substring(0, 1000)}\`\`\``, inline: false });
        }
        
        return embed;
    }
    
    static createRaidEmbed(user, eventType, targetId = null) {
        const embed = buildEmbed({
            title: '🚨 Anti-Raid — Atividade Suspeita',
            description: 'Registro automático de evento suspeito.',
            fields: [
                { name: '👤 Usuário', value: `${user.tag} (${user.id})`, inline: true },
                { name: '🎯 Evento', value: eventType, inline: true },
                { name: '⏰ Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            color: DEFAULT_EMBED_COLOR
        });
            
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
