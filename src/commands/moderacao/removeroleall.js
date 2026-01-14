import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Cargos**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o cargo para remover de todos.\nExemplo: `.removeroleall @cargo`" });
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args[0]);

    if (!role) {
        return message.reply({ content: "❌ Cargo não encontrado." });
    }

    const loadingMsg = await message.reply({ content: "⏳ Processando... Isso pode levar alguns minutos." });

    try {
        const members = await message.guild.members.fetch();
        let sucesso = 0;
        let falhas = 0;

        for (const member of members.values()) {
            if (member.roles.cache.has(role.id)) {
                try {
                    await member.roles.remove(role);
                    sucesso++;
                    // Rate limit protection
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    falhas++;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("➖ Cargo Removido de Todos")
            .setColor("#ff0000")
            .addFields(
                { name: "🎭 Cargo", value: `${role}`, inline: true },
                { name: "✅ Sucesso", value: `${sucesso}`, inline: true },
                { name: "❌ Falhas", value: `${falhas}`, inline: true }
            )
            .setTimestamp();

        await loadingMsg.edit({ content: "", embeds: [embed] });
    } catch (error) {
        console.error("Erro ao remover cargo de todos:", error);
        loadingMsg.edit({ content: "❌ Erro ao remover cargo. Verifique minhas permissões." }).catch(() => {});
    }
}
