import { EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    const embed = new EmbedBuilder()
        .setTitle("📚 Central de Ajuda • Alta Cúpula")
        .setColor("#2b2d31")
        .setDescription("Bot profissional com sistemas avançados de segurança e moderação. Use `.` como prefixo para comandos normais e `/tag` para o sistema de tags.")
        .addFields(
            {
                name: "🧰 Utilidade",
                value: "`.ajuda` `.sobre` `.userinfo` `.serverinfo` `.names` `.userlog` `.online` `.impulso` `.verificartag`"
            },
            {
                name: "🛡️ Moderação",
                value: "`.clear` `.ban` `.kick` `.timeout` `.untimeout` `.lock` `.unlock` `.addrole` `.removerole` `.addroleall` `.removeroleall` `.mutecall` `.unmutecall`"
            },
            {
                name: "🏛️ Organização",
                value: "`.criarcategoria` `.criartexto` `.criarvoz` `.criarcargo` `.excluircargo` `.aceitar` `.recrutamento` `.setrecrutamento`"
            },
            {
                name: "💾 Backup & Segurança",
                value: "`.backup criar` `.backup restaurar` `.backup info`"
            },
            {
                name: "🏷️ Sistema de Tags",
                value: "Sistema automático no canal específico - Clique nos botões para receber sua tag"
            },
            {
                name: "🤖 Sistemas Automáticos",
                value: "• **AutoMod:** Detecta spam, links suspeitos e palavras proibidas\n• **Anti-Raid:** Protege contra ataques coordenados\n• **Verificação:** Sistema automático de escolha de gênero\n• **Backup:** Proteção completa do servidor"
            }
        )
        .setFooter({ text: "Bot desenvolvido profissionalmente • Discord.js v14 • Sistemas de segurança avançados" })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
}

