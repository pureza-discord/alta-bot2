import { buildEmbed } from "../../utils/embed.js";
import { db } from "../../database.js";

export async function execute(message, args, client) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;

    db.get(
        `SELECT messages, voice_time FROM user_stats
         WHERE user_id=? AND guild_id=?`,
        [user.id, message.guild.id],
        async (err, row) => {
            if (err) {
                console.error("Erro ao buscar estatísticas:", err);
                return message.reply({ content: "❌ Erro ao buscar estatísticas." }).catch(() => {});
            }

            if (!row) {
                return message.reply({ 
                    content: `📊 **${user.username}** ainda não possui estatísticas registradas neste servidor.`
                });
            }

            const horas = Math.floor(row.voice_time / 3600);
            const mins = Math.floor((row.voice_time % 3600) / 60);
            const segs = row.voice_time % 60;

            const tempoFormatado = horas > 0 
                ? `${horas}h ${mins}m ${segs}s`
                : mins > 0 
                    ? `${mins}m ${segs}s`
                    : `${segs}s`;

            const embed = buildEmbed({
                title: "📊 Status de Atividade",
                description: "Resumo das estatísticas registradas no servidor.",
                fields: [
                    { name: "👤 Usuário", value: `${user}`, inline: true },
                    { name: "💬 Mensagens enviadas", value: `${row.messages.toLocaleString()}`, inline: true },
                    { name: "🎧 Tempo em call", value: tempoFormatado, inline: true }
                ],
                thumbnail: user.displayAvatarURL({ size: 1024 })
            });

            await message.reply({ embeds: [embed] });
        }
    );
}

