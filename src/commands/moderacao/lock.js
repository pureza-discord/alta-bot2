import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Canais**." });
    }

    const channel = message.channel;

    try {
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
        });

        const embed = buildEmbed({
            title: "🔒 Canal Trancado",
            description: `O canal ${channel} foi trancado com sucesso.`,
            fields: [
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            ]
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao trancar canal:", error);
        message.reply({ content: "❌ Erro ao trancar o canal. Verifique minhas permissões." }).catch(() => {});
    }
}

