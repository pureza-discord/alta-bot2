import { SlashCommandBuilder } from "discord.js";
import { District, War } from "../../services/databaseService.js";
import { challengeWar, acceptWar, finishWar } from "../../systems/warSystem.js";
import { buildEmbed } from "../../utils/embed.js";

export const data = new SlashCommandBuilder()
    .setName("guerra-legacy")
    .setDescription("Gerenciar guerras entre distritos.")
    .addSubcommand((sub) =>
        sub
            .setName("desafiar")
            .setDescription("Desafiar outro distrito.")
            .addStringOption((opt) =>
                opt.setName("distritoa").setDescription("Distrito A").setRequired(true)
            )
            .addStringOption((opt) =>
                opt.setName("distritob").setDescription("Distrito B").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("aceitar")
            .setDescription("Aceitar um desafio pendente.")
            .addStringOption((opt) =>
                opt
                    .setName("guerra")
                    .setDescription("ID da guerra")
                    .setRequired(true)
            )
    )
    .addSubcommand((sub) => sub.setName("iniciar").setDescription("Iniciar guerra aceita."))
    .addSubcommand((sub) =>
        sub
            .setName("finalizar")
            .setDescription("Finalizar guerra e definir vencedor.")
            .addStringOption((opt) =>
                opt.setName("guerra").setDescription("ID da guerra").setRequired(true)
            )
            .addStringOption((opt) =>
                opt.setName("vencedor").setDescription("Nome do distrito vencedor").setRequired(true)
            )
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "desafiar") {
        const districtA = interaction.options.getString("distritoa", true).trim();
        const districtB = interaction.options.getString("distritob", true).trim();
        const captain = await District.findOne({ where: { name: districtA } });
        if (!captain || captain.captainId !== interaction.user.id) {
            return interaction.reply({
                content: "❌ Apenas o Capitão do distrito A pode desafiar.",
                ephemeral: true
            });
        }
        const war = await challengeWar(interaction.guild, districtA, districtB);
        return interaction.reply({
            content: `✅ Desafio criado. Guerra ID: ${war.id}`,
            ephemeral: true
        });
    }

    if (subcommand === "aceitar") {
        const warId = interaction.options.getString("guerra", true);
        const war = await War.findByPk(warId);
        if (!war) {
            return interaction.reply({ content: "❌ Guerra não encontrada.", ephemeral: true });
        }
        const districtB = await District.findByPk(war.districtBId);
        if (!districtB || districtB.captainId !== interaction.user.id) {
            return interaction.reply({
                content: "❌ Apenas o Capitão do distrito B pode aceitar.",
                ephemeral: true
            });
        }
        await acceptWar(interaction.guild, warId);
        return interaction.reply({ content: "✅ Guerra aceita e iniciada.", ephemeral: true });
    }

    if (subcommand === "iniciar") {
        return interaction.reply({ content: "ℹ️ Use /guerra aceitar para iniciar.", ephemeral: true });
    }

    if (subcommand === "finalizar") {
        const warId = interaction.options.getString("guerra", true);
        const winnerName = interaction.options.getString("vencedor", true);
        const winner = await District.findOne({ where: { name: winnerName } });
        if (!winner) {
            return interaction.reply({ content: "❌ Distrito vencedor não encontrado.", ephemeral: true });
        }
        await finishWar(interaction.guild, warId, winner.id);
        return interaction.reply({ content: "✅ Guerra finalizada.", ephemeral: true });
    }
}
