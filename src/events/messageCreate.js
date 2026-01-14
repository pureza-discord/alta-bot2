import { db } from "../database.js";

export const name = "messageCreate";

export async function execute(message, client) {
    if (!message.guild || message.author.bot) return;

    // Verificar AutoMod primeiro (se habilitado)
    if (client.automod) {
        const wasBlocked = await client.automod.checkMessage(message);
        if (wasBlocked) return; // Mensagem foi bloqueada pelo AutoMod
    }

    // Atualizar estatísticas de mensagens
    db.run(
        `INSERT INTO user_stats (user_id, guild_id, messages)
         VALUES (?, ?, 1)
         ON CONFLICT(user_id, guild_id)
         DO UPDATE SET messages = messages + 1`,
        [message.author.id, message.guild.id],
        (err) => {
            if (err) console.error("Erro ao atualizar mensagens:", err);
        }
    );

    // Processar comandos com prefixo "."
    if (!message.content.startsWith(".")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Erro ao executar comando ${commandName}:`, error);
        message.reply("❌ Ocorreu um erro ao executar este comando.").catch(() => {});
    }
}

