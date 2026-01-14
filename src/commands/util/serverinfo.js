import { EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    const guild = message.guild;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
        .setTitle(`🏛️ ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .setColor("#2b2d31")
        .addFields(
            { name: "👑 Dono", value: `${owner.user.tag}`, inline: true },
            { name: "🆔 ID", value: guild.id, inline: true },
            { name: "📅 Criado em", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "👥 Membros", value: `${guild.memberCount}`, inline: true },
            { name: "💬 Canais", value: `${guild.channels.cache.size}`, inline: true },
            { name: "🎭 Cargos", value: `${guild.roles.cache.size}`, inline: true },
            { name: "😀 Emojis", value: `${guild.emojis.cache.size}`, inline: true },
            { name: "✅ Nível de Boost", value: `${guild.premiumTier}`, inline: true },
            { name: "🚀 Boosts", value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
        )
        .setFooter({ text: `Solicitado por ${message.author.tag}` })
        .setTimestamp();

    if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await message.reply({ embeds: [embed] });
}