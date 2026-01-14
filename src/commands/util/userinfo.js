import { EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;
    const member = await message.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
        return message.reply({ content: "❌ Membro não encontrado no servidor." });
    }

    const roles = member.roles.cache
        .filter(role => role.id !== message.guild.id)
        .map(role => role.toString())
        .slice(0, 10)
        .join(", ") || "Nenhum cargo";

    const embed = new EmbedBuilder()
        .setTitle(`👤 Informações de ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ size: 1024 }))
        .setColor(member.displayColor || "#2b2d31")
        .addFields(
            { name: "🆔 ID", value: user.id, inline: true },
            { name: "📅 Conta criada", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "📥 Entrou no servidor", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: "🎭 Cargos", value: roles.length > 1024 ? roles.substring(0, 1021) + "..." : roles, inline: false },
            { name: "🤖 Bot", value: user.bot ? "Sim" : "Não", inline: true },
            { name: "⏰ Status", value: member.presence?.status || "offline", inline: true }
        )
        .setFooter({ text: `Solicitado por ${message.author.tag}` })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}

