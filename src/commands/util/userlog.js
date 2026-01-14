import { EmbedBuilder } from "discord.js";
import { db } from "../../database.js";

export async function execute(message, args, client) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;

    db.all(
        `SELECT type, value, timestamp FROM user_history
         WHERE user_id=? AND (guild_id=? OR guild_id='global')
         ORDER BY timestamp DESC LIMIT 15`,
        [user.id, message.guild.id],
        async (err, rows) => {
            if (err) {
                console.error("Erro ao buscar log:", err);
                return message.reply({ content: "❌ Erro ao buscar log." }).catch(() => {});
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Log de Eventos - ${user.username}`)
                .setThumbnail(user.displayAvatarURL({ size: 1024 }))
                .setColor("#2b2d31")
                .setDescription(rows.length > 0 
                    ? rows.map((row, i) => {
                        const tipo = row.type === "avatar" ? "🖼️" : row.type === "banner" ? "🖼️" : row.type === "username" ? "📝" : "📌";
                        return `**${i + 1}.** ${tipo} ${row.type}: \`${row.value}\` - <t:${Math.floor(row.timestamp / 1000)}:R>`;
                    }).join("\n")
                    : "Nenhum evento registrado ainda."
                )
                .setFooter({ text: `Solicitado por ${message.author.tag}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }
    );
}

