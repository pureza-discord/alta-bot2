import { EmbedBuilder } from 'discord.js';

export const DEFAULT_EMBED_COLOR = '#0f0f0f';
export const DEFAULT_FOOTER_TEXT = 'Alta Cúpula • Sistema Profissional';

export function getEmojiByName(guild, name) {
    if (!guild) return null;
    return guild.emojis.cache.find(emoji => emoji.name === name) ?? null;
}

export function buildEmbed({
    title,
    description,
    fields = [],
    color,
    footerText,
    footerIcon,
    thumbnail,
    image,
    timestamp = true
}) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color || DEFAULT_EMBED_COLOR)
        .setFooter({ text: footerText || DEFAULT_FOOTER_TEXT, iconURL: footerIcon });

    if (fields.length) {
        embed.addFields(fields);
    }

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    if (image) {
        embed.setImage(image);
    }

    if (timestamp) {
        embed.setTimestamp();
    }

    return embed;
}

