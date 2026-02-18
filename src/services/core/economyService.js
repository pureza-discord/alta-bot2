import { prisma } from "../prisma.js";
import { logger } from "../../utils/logger.js";
import { logAudit } from "./auditLogService.js";
import { grantVip, getVipStatus } from "./vipService.js";

export async function getBalance(guildId, discordId) {
    const user = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId } }
    });
    return user?.dinheiro ?? 0;
}

export async function addMoney(guildId, discordId, amount, descricao = "ganho") {
    const user = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { dinheiro: { increment: amount } }
    });
    await prisma.economiaLog.create({
        data: {
            guildId,
            userId: user.id,
            tipo: "credit",
            valor: amount,
            descricao
        }
    });
    logger.info("economy_credit", { guildId, discordId, amount, descricao });
    await logAudit({
        guildId,
        action: "economy.credit",
        actorId: null,
        targetId: discordId,
        source: "economy",
        meta: { amount, descricao }
    });
    return user;
}

export async function removeMoney(guildId, discordId, amount, descricao = "gasto") {
    const current = await prisma.user.findUnique({
        where: { guildId_discordId: { guildId, discordId } }
    });
    if (!current || current.dinheiro < amount) {
        throw new Error("Saldo insuficiente.");
    }
    const user = await prisma.user.update({
        where: { guildId_discordId: { guildId, discordId } },
        data: { dinheiro: { decrement: amount } }
    });
    await prisma.economiaLog.create({
        data: {
            guildId,
            userId: user.id,
            tipo: "debit",
            valor: amount,
            descricao
        }
    });
    logger.info("economy_debit", { guildId, discordId, amount, descricao });
    await logAudit({
        guildId,
        action: "economy.debit",
        actorId: null,
        targetId: discordId,
        source: "economy",
        meta: { amount, descricao }
    });
    return user;
}

export async function transferMoney(guildId, fromDiscordId, toDiscordId, amount) {
    await removeMoney(guildId, fromDiscordId, amount, "transfer_out");
    await addMoney(guildId, toDiscordId, amount, "transfer_in");
    await logAudit({
        guildId,
        action: "economy.transfer",
        actorId: fromDiscordId,
        targetId: toDiscordId,
        source: "economy",
        meta: { amount }
    });
}

export function getStoreItems() {
    return [
        { id: "medal_gold", nome: "Medalha Ouro", preco: 500 },
        { id: "tag_vip", nome: "Tag VIP (7 dias)", preco: 800 },
        { id: "xp_boost", nome: "Boost XP (24h)", preco: 300 }
    ];
}

export function getVipStoreItems() {
    return [
        { id: "vip_extend_7d", nome: "Extensão VIP (7 dias)", preco: 400, days: 7 },
        { id: "vip_extend_30d", nome: "Extensão VIP (30 dias)", preco: 1200, days: 30 }
    ];
}

export async function buyItem(guildId, discordId, itemId, guild = null) {
    const items = getStoreItems();
    const item = items.find((it) => it.id === itemId);
    if (!item) {
        throw new Error("Item não encontrado.");
    }
    await removeMoney(guildId, discordId, item.preco, `compra:${itemId}`);
    await logAudit({
        guildId,
        action: "economy.purchase",
        actorId: discordId,
        targetId: discordId,
        source: "economy",
        meta: { itemId, preco: item.preco }
    });
    if (itemId === "tag_vip") {
        await grantVip(guild, guildId, discordId, 7, "VIP");
    }
    return item;
}

export async function buyVipItem(guildId, discordId, itemId, guild = null) {
    const status = await getVipStatus(guildId, discordId);
    if (!status.active) {
        throw new Error("Apenas VIP pode comprar na loja VIP.");
    }
    const items = getVipStoreItems();
    const item = items.find((it) => it.id === itemId);
    if (!item) {
        throw new Error("Item não encontrado.");
    }
    await removeMoney(guildId, discordId, item.preco, `compra_vip:${itemId}`);
    await logAudit({
        guildId,
        action: "economy.vip_purchase",
        actorId: discordId,
        targetId: discordId,
        source: "economy",
        meta: { itemId, preco: item.preco }
    });
    if (item.days) {
        await grantVip(guild, guildId, discordId, item.days, "VIP");
    }
    return item;
}
