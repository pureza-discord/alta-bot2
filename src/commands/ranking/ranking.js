import { SlashCommandBuilder } from "discord.js";
import {
    getDistrictRankingByPoints,
    getTopInfluence,
    getTopRecruits,
    getTopEvents,
    getTopMessages,
    getGlobalUserRanking
} from "../../services/core/rankingService.js";
import { buildEmbed } from "../../utils/embed.js";
import { prisma } from "../../services/prisma.js";
import { getActiveWar } from "../../services/core/warService.js";

export const data = new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Rankings do sistema.")
    .addSubcommand((sub) => sub.setName("distritos").setDescription("Ranking de distritos."))
    .addSubcommand((sub) => sub.setName("guerra").setDescription("Ranking da guerra atual."))
    .addSubcommand((sub) => sub.setName("influencia").setDescription("Ranking de influência."))
    .addSubcommand((sub) => sub.setName("xp").setDescription("Ranking de XP individual."))
    .addSubcommand((sub) =>
        sub.setName("recrutadores").setDescription("Ranking de recrutadores.")
    )
    .addSubcommand((sub) => sub.setName("eventos").setDescription("Ranking de eventos."))
    .addSubcommand((sub) =>
        sub
            .setName("global")
            .setDescription("Ranking global multi-servidor.")
            .addStringOption((opt) =>
                opt
                    .setName("tipo")
                    .setDescription("mensagens/influencia/recrutas/eventos")
                    .addChoices(
                        { name: "mensagens", value: "mensagens" },
                        { name: "influencia", value: "influencia" },
                        { name: "recrutas", value: "recrutas" },
                        { name: "eventos", value: "eventos" }
                    )
                    .setRequired(true)
            )
    );

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "distritos") {
        const byPoints = await getDistrictRankingByPoints(interaction.guild.id);
        const embed = buildEmbed({
            title: "🏆 Ranking de Distritos",
            fields: [
                {
                    name: "⚔ Por Pontos",
                    value:
                        byPoints.length === 0
                            ? "Sem dados."
                            : byPoints.map((d, i) => `${i + 1}. ${d.nome} — ${d.pontos}`).join("\n"),
                    inline: true
                }
            ]
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "guerra") {
        const war = await getActiveWar(interaction.guild.id);
        if (!war) {
            return interaction.reply({ content: "ℹ️ Nenhuma guerra ativa.", ephemeral: true });
        }
        const [districtA, districtB] = await Promise.all([
            prisma.distrito.findUnique({ where: { id: war.distritoA } }),
            prisma.distrito.findUnique({ where: { id: war.distritoB } })
        ]);
        const embed = buildEmbed({
            title: "⚔ Ranking da Guerra",
            fields: [
                {
                    name: "Desafiante",
                    value: `${districtA?.nome || war.distritoA}`,
                    inline: true
                },
                {
                    name: "Alvo",
                    value: `${districtB?.nome || war.distritoB}`,
                    inline: true
                }
            ]
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "influencia") {
        const top = await getTopInfluence(interaction.guild.id);
        const embed = buildEmbed({
            title: "🧠 Ranking de Influência",
            description:
                top.length === 0
                    ? "Sem dados."
                    : top.map((u, i) => `${i + 1}. <@${u.discordId}> — ${u.influencia}`).join("\n")
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "xp") {
        const top = await getTopMessages(interaction.guild.id);
        const embed = buildEmbed({
            title: "📊 Ranking de XP",
            description:
                top.length === 0
                    ? "Sem dados."
                    : top.map((u, i) => `${i + 1}. <@${u.discordId}> — ${u.mensagens}`).join("\n")
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "recrutadores") {
        const top = await getTopRecruits(interaction.guild.id);
        const embed = buildEmbed({
            title: "🪖 Ranking de Recrutadores",
            description:
                top.length === 0
                    ? "Sem dados."
                    : top.map((u, i) => `${i + 1}. <@${u.discordId}> — ${u.recrutas}`).join("\n")
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "eventos") {
        const top = await getTopEvents(interaction.guild.id);
        const embed = buildEmbed({
            title: "🏆 Ranking de Eventos",
            description:
                top.length === 0
                    ? "Sem dados."
                    : top.map((u, i) => `${i + 1}. <@${u.discordId}> — ${u.eventos}`).join("\n")
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "global") {
        const tipo = interaction.options.getString("tipo", true);
        const rows = await getGlobalUserRanking(tipo, 10);
        const embed = buildEmbed({
            title: "🌍 Ranking Global",
            description:
                rows.length === 0
                    ? "Sem dados."
                    : rows.map((u, i) => `${i + 1}. <@${u.discordId}> — ${u.total}`).join("\n")
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
