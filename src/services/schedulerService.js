import cron from "node-cron";
import { buildEmbed } from "../utils/embed.js";
import { SERVER_CONFIG } from "../utils/config.js";
import { getDistrictRankingByPoints } from "./rankingService.js";
import { War } from "../models/War.js";

function getScheduleChannelId() {
    return process.env.SCHEDULE_CHANNEL_ID || SERVER_CONFIG.EVENTS_CHANNEL;
}

async function sendToChannel(client, embed) {
    const channelId = getScheduleChannelId();
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    await channel.send({ embeds: [embed] });
}

export function initScheduler(client) {
    cron.schedule("0 10 * * 1", async () => {
        const embed = buildEmbed({
            title: "📞 Call Estratégica",
            description: "Segunda-feira de alinhamento. Preparem-se para a reunião tática."
        });
        await sendToChannel(client, embed);
    });

    cron.schedule("0 10 * * 3", async () => {
        const war = await War.findOne({ status: "active" });
        if (!war) return;
        const embed = buildEmbed({
            title: "⚔ Status da Guerra",
            fields: [
                { name: "Desafiante", value: war.challengerDistrictId, inline: true },
                { name: "Alvo", value: war.targetDistrictId, inline: true },
                { name: "Pontos desafiante", value: `${war.challengerPoints}`, inline: true },
                { name: "Pontos alvo", value: `${war.targetPoints}`, inline: true }
            ]
        });
        await sendToChannel(client, embed);
    });

    cron.schedule("0 10 * * 5", async () => {
        const embed = buildEmbed({
            title: "🏆 Torneio da Semana",
            description: "Sexta é dia de torneio. Preparem suas equipes!"
        });
        await sendToChannel(client, embed);
    });

    cron.schedule("0 18 * * 0", async () => {
        const districts = await getDistrictRankingByPoints(10);
        const embed = buildEmbed({
            title: "📊 Ranking Semanal",
            description:
                districts.length === 0
                    ? "Sem dados."
                    : districts.map((d, i) => `${i + 1}. ${d.name} — ${d.points}`).join("\n")
        });
        await sendToChannel(client, embed);
    });
}
