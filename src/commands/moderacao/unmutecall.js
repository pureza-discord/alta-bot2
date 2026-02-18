import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return message.reply({ content: "❌ Você precisa da permissão **Silenciar Membros**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o membro para desmutar na call.\nExemplo: `.unmutecall @membro`" });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    if (!member.voice.channel) {
        return message.reply({ content: "❌ Este membro não está em um canal de voz." });
    }

    try {
        await member.voice.setMute(false);
        await member.voice.setDeaf(false);

        const embed = buildEmbed({
            title: "🔊 Membro Desmutado na Call",
            description: "Ação aplicada ao membro em canal de voz.",
            fields: [
                { name: "👤 Membro", value: `${member.user.tag}`, inline: true },
                { name: "🎧 Canal", value: `${member.voice.channel}`, inline: true },
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            ]
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao desmutar membro:", error);
        message.reply({ content: "❌ Erro ao desmutar o membro. Verifique minhas permissões." }).catch(() => {});
    }
}
