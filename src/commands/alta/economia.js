import { SlashCommandBuilder } from "discord.js";
import { getBalance, transferMoney, getStoreItems, buyItem, getVipStoreItems, buyVipItem } from "../../services/core/economyService.js";

export const data = new SlashCommandBuilder()
    .setName("economia")
    .setDescription("Economia da ALTA")
    .addSubcommand((sub) => sub.setName("saldo").setDescription("Ver saldo"))
    .addSubcommand((sub) =>
        sub
            .setName("transferir")
            .setDescription("Transferir dinheiro")
            .addUserOption((opt) => opt.setName("usuario").setDescription("Destino").setRequired(true))
            .addIntegerOption((opt) => opt.setName("valor").setDescription("Valor").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("loja").setDescription("Listar loja"))
    .addSubcommand((sub) => sub.setName("loja-vip").setDescription("Listar loja VIP"))
    .addSubcommand((sub) =>
        sub
            .setName("comprar")
            .setDescription("Comprar item")
            .addStringOption((opt) => opt.setName("item").setDescription("ID do item").setRequired(true))
    )
    .addSubcommand((sub) =>
        sub
            .setName("comprar-vip")
            .setDescription("Comprar item VIP")
            .addStringOption((opt) => opt.setName("item").setDescription("ID do item").setRequired(true))
    );

export async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    if (sub === "saldo") {
        const saldo = await getBalance(guildId, userId);
        return interaction.reply({ content: `💰 Saldo: ${saldo}`, ephemeral: true });
    }

    if (sub === "transferir") {
        const target = interaction.options.getUser("usuario", true);
        const valor = interaction.options.getInteger("valor", true);
        await transferMoney(guildId, userId, target.id, valor);
        return interaction.reply({ content: "✅ Transferência realizada.", ephemeral: true });
    }

    if (sub === "loja") {
        const items = getStoreItems();
        const lines = items.map((it) => `${it.id} — ${it.nome} (${it.preco})`).join("\n");
        return interaction.reply({ content: lines || "Loja vazia.", ephemeral: true });
    }

    if (sub === "loja-vip") {
        const items = getVipStoreItems();
        const lines = items.map((it) => `${it.id} — ${it.nome} (${it.preco})`).join("\n");
        return interaction.reply({ content: lines || "Loja VIP vazia.", ephemeral: true });
    }

    if (sub === "comprar") {
        const itemId = interaction.options.getString("item", true);
        const item = await buyItem(guildId, userId, itemId, interaction.guild);
        return interaction.reply({ content: `✅ Comprado: ${item.nome}`, ephemeral: true });
    }

    if (sub === "comprar-vip") {
        const itemId = interaction.options.getString("item", true);
        const item = await buyVipItem(guildId, userId, itemId, interaction.guild);
        return interaction.reply({ content: `✅ Comprado: ${item.nome}`, ephemeral: true });
    }
}
