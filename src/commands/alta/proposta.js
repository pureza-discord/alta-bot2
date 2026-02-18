import { SlashCommandBuilder } from "discord.js";
import { createProposal, voteProposal, closeProposal, listProposals } from "../../services/core/influenceService.js";

export const data = new SlashCommandBuilder()
    .setName("proposta")
    .setDescription("Sistema de propostas")
    .addSubcommand((sub) =>
        sub
            .setName("criar")
            .setDescription("Criar proposta")
            .addStringOption((opt) => opt.setName("titulo").setDescription("Título").setRequired(true))
            .addStringOption((opt) => opt.setName("descricao").setDescription("Descrição").setRequired(false))
    )
    .addSubcommand((sub) =>
        sub
            .setName("votar")
            .setDescription("Votar proposta")
            .addStringOption((opt) => opt.setName("id").setDescription("ID da proposta").setRequired(true))
            .addStringOption((opt) =>
                opt
                    .setName("voto")
                    .setDescription("sim/nao")
                    .addChoices({ name: "sim", value: "sim" }, { name: "nao", value: "nao" })
                    .setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("encerrar")
            .setDescription("Encerrar proposta")
            .addStringOption((opt) => opt.setName("id").setDescription("ID da proposta").setRequired(true))
    )
    .addSubcommand((sub) =>
        sub
            .setName("listar")
            .setDescription("Listar propostas")
            .addStringOption((opt) =>
                opt
                    .setName("status")
                    .setDescription("open/closed")
                    .addChoices({ name: "open", value: "open" }, { name: "closed", value: "closed" })
                    .setRequired(false)
            )
    );

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "criar") {
        const titulo = interaction.options.getString("titulo", true);
        const descricao = interaction.options.getString("descricao") || null;
        const proposta = await createProposal(guildId, interaction.user.id, titulo, descricao);
        return interaction.reply({ content: `✅ Proposta criada: ${proposta.id}`, ephemeral: true });
    }

    if (sub === "votar") {
        const id = interaction.options.getString("id", true);
        const voto = interaction.options.getString("voto", true);
        await voteProposal(guildId, id, interaction.user.id, voto);
        return interaction.reply({ content: "✅ Voto registrado.", ephemeral: true });
    }

    if (sub === "encerrar") {
        const id = interaction.options.getString("id", true);
        const result = await closeProposal(guildId, id);
        const status = result.approved ? "✅ Aprovada" : "❌ Rejeitada";
        return interaction.reply({
            content: `✅ Proposta encerrada. ${status} (Sim ${result.proposal.votosSim} / Não ${result.proposal.votosNao}).`,
            ephemeral: true
        });
    }

    if (sub === "listar") {
        const status = interaction.options.getString("status") || "open";
        const propostas = await listProposals(guildId, status);
        if (propostas.length === 0) {
            return interaction.reply({ content: "Sem propostas.", ephemeral: true });
        }
        const lines = propostas.map(
            (p) => `• ${p.id} — ${p.titulo} (Sim ${p.votosSim} / Não ${p.votosNao})`
        );
        return interaction.reply({ content: lines.join("\n"), ephemeral: true });
    }
}
