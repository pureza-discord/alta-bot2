import { PermissionFlagsBits, EmbedBuilder, ChannelType } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Canais**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Uso: `.criarcategoria <nome>`\nExemplo: `.criarcategoria Geral`" });
    }

    const nome = args.join(" ");

    try {
        const categoria = await message.guild.channels.create({
            name: nome,
            type: ChannelType.GuildCategory
        });

        const embed = new EmbedBuilder()
            .setTitle("📁 Categoria Criada")
            .setDescription(`A categoria **${categoria.name}** foi criada com sucesso!`)
            .setColor("#00ff00")
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
        message.reply({ content: "❌ Erro ao criar categoria. Verifique minhas permissões." }).catch(() => {});
    }
}
