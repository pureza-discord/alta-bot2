import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return message.reply({ content: "❌ Você precisa da permissão **Silenciar Membros**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o membro para mutar na call.\nExemplo: `.mutecall @membro motivo`" });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const motivo = args.slice(1).join(" ") || "Sem motivo fornecido";

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    if (!member.voice.channel) {
        return message.reply({ content: "❌ Este membro não está em um canal de voz." });
    }

    try {
        await member.voice.setMute(true);
        await member.voice.setDeaf(true);

        const embed = new EmbedBuilder()
            .setTitle("🔇 Membro Mutado na Call")
            .setColor("#ff0000")
            .addFields(
                { name: "👤 Membro", value: `${member.user.tag}`, inline: true },
                { name: "🎧 Canal", value: `${member.voice.channel}`, inline: true },
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true },
                { name: "📝 Motivo", value: motivo, inline: false }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao mutar membro:", error);
        message.reply({ content: "❌ Erro ao mutar o membro. Verifique minhas permissões." }).catch(() => {});
    }
}
