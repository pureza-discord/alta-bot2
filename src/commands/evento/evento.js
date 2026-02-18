import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} from "discord.js";
import { buildEmbed } from "../../utils/embed.js";
import { createEvent, finalizeEvent, registerParticipant } from "../../services/core/eventService.js";
import { getUser } from "../../services/core/userService.js";

export const data = new SlashCommandBuilder()
    .setName("evento")
    .setDescription("Sistema de eventos.")
    .addSubcommand((sub) =>
        sub
            .setName("criar")
            .setDescription("Criar evento.")
            .addStringOption((opt) =>
                opt.setName("titulo").setDescription("Título do evento").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("finalizar")
            .setDescription("Finalizar evento e definir vencedor.")
            .addStringOption((opt) =>
                opt.setName("evento").setDescription("ID do evento").setRequired(true)
            )
            .addUserOption((opt) =>
                opt.setName("vencedor").setDescription("Vencedor").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("registrar")
            .setDescription("Registrar participação manual.")
            .addStringOption((opt) =>
                opt.setName("evento").setDescription("ID do evento").setRequired(true)
            )
            .addUserOption((opt) =>
                opt.setName("usuario").setDescription("Participante").setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "criar") {
        const title = interaction.options.getString("titulo", true).trim();
        const event = await createEvent(interaction.guild.id, title, interaction.user.id);

        const embed = buildEmbed({
            title: "📣 Evento criado",
            description: `**${title}**`,
            fields: [{ name: "ID", value: event.id, inline: true }]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`evento_participar:${event.id}`)
                .setLabel("Participar")
                .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (sub === "finalizar") {
        const eventId = interaction.options.getString("evento", true);
        const winner = interaction.options.getUser("vencedor", true);
        const winnerProfile = await getUser(interaction.guild.id, winner.id);
        await finalizeEvent(
            interaction.guild.id,
            eventId,
            winner.id,
            winnerProfile?.distritoId || null,
            interaction.guild
        );
        return interaction.reply({
            content: `✅ Evento finalizado. Vencedor: ${winner}`,
            ephemeral: true
        });
    }

    if (sub === "registrar") {
        const eventId = interaction.options.getString("evento", true);
        const user = interaction.options.getUser("usuario", true);
        await registerParticipant(interaction.guild.id, eventId, user.id);
        return interaction.reply({ content: "✅ Participação registrada.", ephemeral: true });
    }
}
