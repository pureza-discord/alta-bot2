import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { getVipStatus, grantVip, revokeVip } from "../../services/core/vipService.js";

export const data = new SlashCommandBuilder()
    .setName("vip")
    .setDescription("Sistema VIP")
    .addSubcommand((sub) => sub.setName("status").setDescription("Ver seu status VIP"))
    .addSubcommand((sub) =>
        sub
            .setName("dar")
            .setDescription("Conceder VIP")
            .addUserOption((opt) => opt.setName("usuario").setDescription("Usuário").setRequired(true))
            .addIntegerOption((opt) => opt.setName("dias").setDescription("Dias").setRequired(true))
    )
    .addSubcommand((sub) =>
        sub
            .setName("remover")
            .setDescription("Remover VIP")
            .addUserOption((opt) => opt.setName("usuario").setDescription("Usuário").setRequired(true))
    );

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "status") {
        const status = await getVipStatus(guildId, interaction.user.id);
        if (!status.active) {
            return interaction.reply({ content: "❌ Você não possui VIP ativo.", ephemeral: true });
        }
        return interaction.reply({
            content: `✅ VIP ativo até <t:${Math.floor(new Date(status.expiresAt).getTime() / 1000)}:F>.`,
            ephemeral: true
        });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ Apenas administradores podem usar isso.", ephemeral: true });
    }

    if (sub === "dar") {
        const target = interaction.options.getUser("usuario", true);
        const days = interaction.options.getInteger("dias", true);
        await grantVip(interaction.guild, guildId, target.id, days, "VIP");
        return interaction.reply({ content: `✅ VIP concedido para ${target.tag}.`, ephemeral: true });
    }

    if (sub === "remover") {
        const target = interaction.options.getUser("usuario", true);
        await revokeVip(interaction.guild, guildId, target.id, "admin");
        return interaction.reply({ content: `✅ VIP removido de ${target.tag}.`, ephemeral: true });
    }
}
