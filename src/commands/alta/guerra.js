import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { challengeWar, acceptWar, finalizeWar, getActiveWar } from "../../services/core/warService.js";
import { findDistrictByName } from "../../services/core/districtService.js";
import { prisma } from "../../services/prisma.js";

export const data = new SlashCommandBuilder()
    .setName("guerra")
    .setDescription("Sistema de guerra")
    .addSubcommand((sub) =>
        sub
            .setName("desafiar")
            .setDescription("Desafiar distrito")
            .addStringOption((opt) => opt.setName("distritoa").setDescription("Distrito A").setRequired(true))
            .addStringOption((opt) => opt.setName("distritob").setDescription("Distrito B").setRequired(true))
    )
    .addSubcommand((sub) =>
        sub
            .setName("aceitar")
            .setDescription("Aceitar guerra")
            .addStringOption((opt) => opt.setName("guerra").setDescription("ID da guerra").setRequired(true))
    )
    .addSubcommand((sub) =>
        sub
            .setName("finalizar")
            .setDescription("Finalizar guerra")
            .addStringOption((opt) => opt.setName("guerra").setDescription("ID da guerra").setRequired(true))
            .addStringOption((opt) => opt.setName("vencedor").setDescription("ID do distrito vencedor").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("ativa").setDescription("Guerra ativa"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "desafiar") {
        const distritoA = interaction.options.getString("distritoa", true);
        const distritoB = interaction.options.getString("distritob", true);
        const districtA = await findDistrictByName(guildId, distritoA);
        const districtB = await findDistrictByName(guildId, distritoB);
        if (!districtA || !districtB) {
            return interaction.reply({ content: "❌ Distrito não encontrado.", ephemeral: true });
        }
        if (districtA.capitaoId && districtA.capitaoId !== interaction.user.id) {
            return interaction.reply({ content: "❌ Apenas o Capitão pode desafiar.", ephemeral: true });
        }
        const war = await challengeWar(guildId, districtA.id, districtB.id);
        return interaction.reply({ content: `✅ Guerra criada: ${war.id}`, ephemeral: true });
    }

    if (sub === "aceitar") {
        const warId = interaction.options.getString("guerra", true);
        const war = await prisma.guerra.findUnique({ where: { id: warId } });
        if (war) {
            const districtB = await prisma.distrito.findUnique({ where: { id: war.distritoB } });
            if (districtB?.capitaoId && districtB.capitaoId !== interaction.user.id) {
                return interaction.reply({ content: "❌ Apenas o Capitão pode aceitar.", ephemeral: true });
            }
        }
        await acceptWar(guildId, warId);
        return interaction.reply({ content: "✅ Guerra aceita.", ephemeral: true });
    }

    if (sub === "finalizar") {
        const warId = interaction.options.getString("guerra", true);
        const vencedorNome = interaction.options.getString("vencedor", true);
        const vencedor = await findDistrictByName(guildId, vencedorNome);
        if (!vencedor) {
            return interaction.reply({ content: "❌ Distrito vencedor não encontrado.", ephemeral: true });
        }
        await finalizeWar(guildId, warId, vencedor.id, [], interaction.guild);
        return interaction.reply({ content: "✅ Guerra finalizada.", ephemeral: true });
    }

    if (sub === "ativa") {
        const war = await getActiveWar(guildId);
        if (!war) {
            return interaction.reply({ content: "Nenhuma guerra ativa.", ephemeral: true });
        }
        const [a, b] = await Promise.all([
            prisma.distrito.findUnique({ where: { id: war.distritoA } }),
            prisma.distrito.findUnique({ where: { id: war.distritoB } })
        ]);
        return interaction.reply({
            content: `⚔ ${a?.nome || war.distritoA} x ${b?.nome || war.distritoB}`,
            ephemeral: true
        });
    }
}
