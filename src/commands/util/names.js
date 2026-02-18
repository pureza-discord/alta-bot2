import { buildEmbed } from "../../utils/embed.js";
import { db } from "../../database.js";

export async function execute(message, args, client) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;

    db.all(
        `SELECT value, timestamp FROM user_history
         WHERE user_id=? AND (guild_id=? OR guild_id='global') AND type='username'
         ORDER BY timestamp DESC LIMIT 10`,
        [user.id, message.guild.id],
        async (err, rows) => {
            if (err) {
                console.error("Erro ao buscar histórico:", err);
                return message.reply({ content: "❌ Erro ao buscar histórico." }).catch(() => {});
            }

            const historyText = rows.length > 0
                ? rows.map((row, i) => `• **${i + 1}.** \`${row.value}\` — <t:${Math.floor(row.timestamp / 1000)}:R>`).join("\n")
                : "• Nenhum nome anterior registrado.\n• O histórico é salvo quando o nome é alterado.";

            const embed = buildEmbed({
                title: `📝 Histórico de Nomes — ${user.username}`,
                description: "Registro dos últimos nomes utilizados no servidor.",
                fields: [
                    {
                        name: "📌 Últimas alterações",
                        value: historyText,
                        inline: false
                    }
                ],
                thumbnail: user.displayAvatarURL({ size: 1024 })
            });

            await message.reply({ embeds: [embed] });
        }
    );
}

