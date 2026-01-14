import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Canais**." });
    }

    const channel = message.channel;

    try {
        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
        });

        const embed = new EmbedBuilder()
            .setTitle("🔓 Canal Destrancado")
            .setDescription(`O canal ${channel} foi destrancado com sucesso.`)
            .setColor("#00ff00")
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao destrancar canal:", error);
        message.reply({ content: "❌ Erro ao destrancar o canal. Verifique minhas permissões." }).catch(() => {});
    }
}

