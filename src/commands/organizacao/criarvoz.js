import { PermissionFlagsBits, ChannelType } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Canais**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Uso: `.criarvoz <nome> [categoria]`\nExemplo: `.criarvoz Geral`" });
    }

    const nome = args[0];
    const categoria = message.mentions.channels.first()?.parent || (args[1] ? message.guild.channels.cache.find(c => c.name === args[1] && c.type === ChannelType.GuildCategory) : null);

    try {
        const canal = await message.guild.channels.create({
            name: nome,
            type: ChannelType.GuildVoice,
            parent: categoria?.id || null
        });

        const embed = buildEmbed({
            title: "🎧 Canal de Voz Criado",
            description: `O canal ${canal} foi criado com sucesso.`,
            fields: [
                { name: "👮 Moderador", value: `${message.author.tag}`, inline: true }
            ]
        });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao criar canal de voz:", error);
        message.reply({ content: "❌ Erro ao criar canal. Verifique minhas permissões." }).catch(() => {});
    }
}
