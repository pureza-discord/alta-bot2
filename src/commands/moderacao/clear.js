import { PermissionFlagsBits } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Mensagens**." });
    }

    if (!args[0] || isNaN(args[0])) {
        return message.reply({ content: "❌ Por favor, especifique a quantidade de mensagens para apagar (1-100).\nExemplo: `.clear 10`" });
    }

    const quantidade = parseInt(args[0]);
    
    if (quantidade < 1 || quantidade > 100) {
        return message.reply({ content: "❌ A quantidade deve ser entre 1 e 100." });
    }

    try {
        const messages = await message.channel.bulkDelete(quantidade + 1, true); // +1 para incluir a mensagem do comando
        const reply = await message.reply({ content: `✅ ${messages.size - 1} mensagem(ns) apagada(s) com sucesso!` });
        setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (error) {
        console.error("Erro ao apagar mensagens:", error);
        message.reply({ content: "❌ Erro ao apagar mensagens. Mensagens podem ter mais de 14 dias." }).catch(() => {});
    }
}

