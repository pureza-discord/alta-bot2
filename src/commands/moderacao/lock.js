import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Canais**." });
    }

    const channel = message.channel;

    try {
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
        });

        const embed = new EmbedBuilder()
            .setTitle("🔒 Canal Trancado")
            .setDescription(`O canal ${channel} foi trancado com sucesso.`)
            .setColor("#ff0000")
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao trancar canal:", error);
        message.reply({ content: "❌ Erro ao trancar o canal. Verifique minhas permissões." }).catch(() => {});
    }
}

