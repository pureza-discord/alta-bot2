import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Cargos**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o cargo para adicionar a todos.\nExemplo: `.addroleall @cargo`" });
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
            if (!member.roles.cache.has(role.id) && !member.user.bot) {
                try {
                    await member.roles.add(role);
                    sucesso++;
                    // Rate limit protection
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    falhas++;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("➕ Cargo Adicionado a Todos")
            .setColor(role.color || "#2b2d31")
            .addFields(
                { name: "🎭 Cargo", value: `${role}`, inline: true },
                { name: "✅ Sucesso", value: `${sucesso}`, inline: true },
                { name: "❌ Falhas", value: `${falhas}`, inline: true }
            )
            .setTimestamp();

        await loadingMsg.edit({ content: "", embeds: [embed] });
    } catch (error) {
        console.error("Erro ao adicionar cargo a todos:", error);
        loadingMsg.edit({ content: "❌ Erro ao adicionar cargo. Verifique minhas permissões." }).catch(() => {});
    }
}
