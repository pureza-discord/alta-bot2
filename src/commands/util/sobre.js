import { EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    const embed = new EmbedBuilder()
        .setTitle("🤖 Sobre o Bot • Alta Cúpula")
        .setColor("#2b2d31")
        .setDescription("Bot profissional desenvolvido para a Alta Cúpula com todas as funcionalidades necessárias.")
        .addFields(
            {
                name: "📊 Estatísticas",
                value: `**Servidores:** ${client.guilds.cache.size}\n**Usuários:** ${client.users.cache.size}\n**Comandos:** ${client.commands.size}`,
                inline: true
            },
            {
                name: "⚙️ Tecnologias",
                value: "**Node.js** + **Discord.js v14**\n**SQLite3** para database\n**Prefix + Slash Commands**",
                inline: true
            },
            {
                name: "👨‍💻 Desenvolvedor",
                value: "**Taki**\nBot 100% funcional e profissional",
                inline: true
            }
        )
        .setFooter({ text: "Alta Cúpula • Versão 2.0.0" })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}

