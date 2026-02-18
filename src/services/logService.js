import { buildEmbed } from "../utils/embed.js";
import { logAudit } from "./core/auditLogService.js";

async function sendLog(guild, channelName, embed) {
    const channel = guild.channels.cache.find(
        (ch) => ch.name === channelName && ch.isTextBased()
    );
    if (!channel) return;
    await channel.send({ embeds: [embed] });
}

export async function logPromotion(guild, payload) {
    const embed = buildEmbed({
        title: "⬆️ Promoção",
        fields: [
            { name: "Usuário", value: `<@${payload.userId}>`, inline: true },
            { name: "De", value: payload.fromRank, inline: true },
            { name: "Para", value: payload.toRank, inline: true },
            { name: "Motivo", value: payload.reason, inline: false }
        ]
    });
    await sendLog(guild, "logs-cargos", embed);
    await logAudit({
        guildId: guild.id,
        action: "promotion.change",
        actorId: payload.actorId || null,
        targetId: payload.userId,
        source: "promotion",
        meta: payload
    });
}

export async function logWar(guild, payload) {
    const embed = buildEmbed({
        title: "⚔️ Guerra",
        fields: [
            { name: "Distrito A", value: payload.districtA, inline: true },
            { name: "Distrito B", value: payload.districtB, inline: true },
            { name: "Status", value: payload.status, inline: true },
            { name: "Motivo", value: payload.reason || "-", inline: false }
        ]
    });
    await sendLog(guild, "logs-guerra", embed);
    await logAudit({
        guildId: guild.id,
        action: "war.update",
        actorId: payload.actorId || null,
        targetId: payload.targetId || null,
        source: "war",
        meta: payload
    });
}

export async function logMerit(guild, payload) {
    const embed = buildEmbed({
        title: "⭐ Mérito",
        fields: [
            { name: "Usuário", value: `<@${payload.userId}>`, inline: true },
            { name: "Delta", value: `${payload.delta}`, inline: true },
            { name: "Pontos", value: `${payload.points}`, inline: true },
            { name: "Estrelas", value: `${payload.stars}`, inline: true }
        ]
    });
    await sendLog(guild, "logs-cargos", embed);
    await logAudit({
        guildId: guild.id,
        action: "merit.update",
        actorId: payload.actorId || null,
        targetId: payload.userId,
        source: "merit",
        meta: payload
    });
}

export async function logEvent(guild, payload) {
    const embed = buildEmbed({
        title: "🏆 Evento",
        fields: [
            { name: "Evento", value: payload.title, inline: true },
            { name: "Ação", value: payload.action, inline: true },
            { name: "Vencedor", value: payload.winner ? `<@${payload.winner}>` : "-", inline: true }
        ]
    });
    await sendLog(guild, "logs-eventos", embed);
    await logAudit({
        guildId: guild.id,
        action: "event.update",
        actorId: payload.actorId || null,
        targetId: payload.winner || null,
        source: "event",
        meta: payload
    });
}

export async function logRecruitment(guild, payload) {
    const embed = buildEmbed({
        title: "🧠 Recrutamento",
        fields: [
            { name: "Recrutador", value: `<@${payload.recruiterId}>`, inline: true },
            { name: "Novo membro", value: `<@${payload.newMemberId}>`, inline: true },
            { name: "Status", value: payload.status, inline: true }
        ]
    });
    await sendLog(guild, "logs-recrutamento", embed);
    await logAudit({
        guildId: guild.id,
        action: "recruitment.update",
        actorId: payload.recruiterId || null,
        targetId: payload.newMemberId,
        source: "recruitment",
        meta: payload
    });
}
