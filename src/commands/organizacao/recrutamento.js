import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../../utils/embed.js";
import { db } from "../../database.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Servidor**." });
    }

    const membro = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;

    db.all(
        `SELECT user_id, approved_count FROM recruitment
         WHERE guild_id=? AND approved_by=?`,
        [message.guild.id, membro.id],
        async (err, rows) => {
            if (err) {
                console.error("Erro ao buscar recrutamentos:", err);
                return message.reply({ content: "❌ Erro ao buscar informações de recrutamento." }).catch(() => {});
            }

            if (rows.length === 0) {
                return message.reply({ 
                    content: `📊 **${membro.username}** ainda não aprovou nenhum membro neste servidor.`
                });
            }

            const totalAprovacoes = rows.reduce((sum, row) => sum + row.approved_count, 0);
            const membrosAprovados = rows.length;

            let lista = "";
            for (let i = 0; i < Math.min(rows.length, 10); i++) {
                try {
                    const user = await client.users.fetch(rows[i].user_id);
                    lista += `${i + 1}. ${user.tag} (${rows[i].approved_count} aprovação(ões))\n`;
                } catch {
                    lista += `${i + 1}. ID: ${rows[i].user_id} (${rows[i].approved_count} aprovação(ões))\n`;
                }
            }

            if (rows.length > 10) {
                lista += `\n... e mais ${rows.length - 10} membro(s)`;
            }

            const embed = buildEmbed({
                title: `📊 Estatísticas de Recrutamento — ${membro.username}`,
                description: "Resumo de aprovações registradas.",
                fields: [
                    { name: "👥 Membros aprovados", value: `${membrosAprovados}`, inline: true },
                    { name: "✅ Total de aprovações", value: `${totalAprovacoes}`, inline: true },
                    { name: "📋 Lista", value: lista || "Nenhum membro aprovado", inline: false }
                ],
                thumbnail: membro.displayAvatarURL({ size: 1024 })
            });

            await message.reply({ embeds: [embed] });
        }
    );
}
