import { buildEmbed } from "../../utils/embed.js";

export async function execute(message, args, client) {
    const embed = buildEmbed({
        title: "🆘 Central de Ajuda — Alta Cúpula",
        description:
            "Bot profissional de gerenciamento, segurança e automações.\n" +
            "Use o prefixo \".\" antes dos comandos.",
        fields: [
            {
                name: "🧰 Utilidade",
                value:
                    "• `.ajuda`\n• `.sobre`\n• `.userinfo`\n• `.serverinfo`\n• `.names`\n" +
                    "• `.userlog`\n• `.online`\n• `.impulso`\n• `.verificartag`",
                inline: false
            },
            {
                name: "🛡️ Moderação",
                value:
                    "• `.clear`\n• `.ban`\n• `.kick`\n• `.timeout`\n• `.untimeout`\n" +
                    "• `.lock`\n• `.unlock`\n• `.addrole`\n• `.removerole`\n" +
                    "• `.addroleall`\n• `.removeroleall`\n• `.mutecall`\n• `.unmutecall`",
                inline: false
            },
            {
                name: "🗂️ Organização",
                value:
                    "• `.criarcategoria`\n• `.criartexto`\n• `.criarvoz`\n• `.criarcargo`\n" +
                    "• `.excluircargo`\n• `.aceitar`\n• `.recrutamento`\n• `.setrecrutamento`",
                inline: false
            },
            {
                name: "🔐 Segurança & Backup",
                value: "• `.backup criar`\n• `.backup restaurar`\n• `.backup info`",
                inline: false
            },
            {
                name: "🤖 Sistemas Automáticos",
                value:
                    "• AutoMod (anti-spam, links suspeitos e palavras proibidas)\n" +
                    "• Anti-Raid (proteção contra ações suspeitas)\n" +
                    "• Verificação (escolha de gênero)\n" +
                    "• Backup automático do servidor",
                inline: false
            }
        ],
        footerText: "Alta Cúpula • Taki Bot"
    });

    await message.reply({ embeds: [embed] });
}

