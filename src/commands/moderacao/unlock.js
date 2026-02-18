import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Canais**." });
    }

    const channel = message.channel;

    try {
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
        });

        const embed = buildEmbed({
            title: "🔓 Canal Destrancado",
            description: `O canal ${channel} foi destrancado com sucesso.`,
            fields: [
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            ]
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao destrancar canal:", error);
        message.reply({ content: "❌ Erro ao destrancar o canal. Verifique minhas permissões." }).catch(() => {});
    }
}

