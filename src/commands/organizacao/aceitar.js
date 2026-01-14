import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../database.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Servidor**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o membro que foi aprovado.\nExemplo: `.aceitar @membro`" });
    }

    const membro = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    const aprovador = message.author;

    if (!membro) {
        return message.reply({ content: "❌ Membro não encontrado." });
    }

    db.run(
        `INSERT INTO recruitment (user_id, guild_id, approved_by, approved_count)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(user_id, guild_id)
         DO UPDATE SET approved_by = ?, approved_count = approved_count + 1`,
        [membro.id, message.guild.id, aprovador.id, aprovador.id],
        async (err) => {
            if (err) {
                console.error("Erro ao registrar aprovação:", err);
                return message.reply({ content: "❌ Erro ao registrar aprovação." }).catch(() => {});
            }

            db.get(
                `SELECT approved_count FROM recruitment WHERE user_id=? AND guild_id=?`,
                [membro.id, message.guild.id],
                async (err, row) => {
                    if (err) {
                        console.error("Erro ao buscar contagem:", err);
                        return message.reply({ content: "❌ Erro ao buscar informações." }).catch(() => {});
                    }

                    const embed = new EmbedBuilder()
                        .setTitle("✅ Membro Aprovado")
                        .setColor("#00ff00")
                        .addFields(
                            { name: "👤 Membro", value: `${membro.tag}`, inline: true },
                            { name: "👮 Aprovado por", value: `${aprovador.tag}`, inline: true },
                            { name: "📊 Total de aprovações", value: `${row.approved_count}`, inline: true }
                        )
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                }
            );
        }
    );
}
