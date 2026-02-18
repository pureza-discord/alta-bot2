import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply({ content: "❌ Você precisa da permissão **Moderar Membros**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o membro para remover timeout.\nExemplo: `.untimeout @membro`" });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    if (!member.isCommunicationDisabled()) {
        return message.reply({ content: "❌ Este membro não está em timeout." });
    }

    try {
        await member.timeout(null);

        const embed = buildEmbed({
            title: "🔊 Timeout Removido",
            description: "Ação de moderação concluída.",
            fields: [
                { name: "👤 Membro", value: `${member.user.tag}`, inline: true },
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            ]
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao remover timeout:", error);
        message.reply({ content: "❌ Erro ao remover timeout. Verifique minhas permissões." }).catch(() => {});
    }
}

