import { PermissionFlagsBits, EmbedBuilder } from "discord.js";

export async function execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({ content: "❌ Você precisa da permissão **Gerenciar Cargos**." });
    }

    if (!args[0]) {
        return message.reply({ content: "❌ Mencione o cargo para excluir.\nExemplo: `.excluircargo @cargo`" });
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args[0]);

    if (!role) {
        return message.reply({ content: "❌ Cargo não encontrado." });
    }

    if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
        return message.reply({ content: "❌ Você não pode excluir um cargo igual ou superior ao seu." });
    }

    try {
        const nomeCargo = role.name;
        await role.delete(`Excluído por ${message.author.tag}`);

        const embed = new EmbedBuilder()
            .setTitle("🗑️ Cargo Excluído")
            .setDescription(`O cargo **${nomeCargo}** foi excluído com sucesso!`)
            .setColor("#ff0000")
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error("Erro ao excluir cargo:", error);
        message.reply({ content: "❌ Erro ao excluir cargo. Verifique minhas permissões e a hierarquia." }).catch(() => {});
    }
}
