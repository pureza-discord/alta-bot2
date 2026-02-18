import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    const embed = buildEmbed({
        title: "🤖 Sobre o Bot — Alta Cúpula",
        description: "Informações oficiais sobre o bot e sua estrutura.",
        fields: [
            {
                name: "📊 Estatísticas",
                value:
                    `• **Servidores:** ${client.guilds.cache.size}\n` +
                    `• **Usuários:** ${client.users.cache.size}\n` +
                    `• **Comandos:** ${client.commands.size}`,
                inline: true
            },
            {
                name: "⚙️ Tecnologias",
                value:
                    "• **Node.js**\n" +
                    "• **Discord.js v14**\n" +
                    "• **SQLite3**\n" +
                    "• **Prefix + Slash Commands**",
                inline: true
            },
            {
                name: "👨‍💻 Desenvolvedor",
                value: "• **Taki**\n• Bot multi funções da alta cúpula",
                inline: true
            }
        ]
    });

    await message.reply({ embeds: [embed] });
}

