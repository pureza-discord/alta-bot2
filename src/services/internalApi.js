import express from "express";
import { internalAuth } from "../middlewares/internalAuth.js";
import { challengeWar, finalizeWar } from "./core/warService.js";
import { startSeason, endSeason } from "./core/seasonService.js";
import { prisma } from "./prisma.js";
import { getAuditLogs } from "./core/auditLogService.js";
import { createContract, getActiveContracts } from "./core/contractService.js";
import { getActiveDistrictMissions } from "./core/missionService.js";
import { grantVip, revokeVip } from "./core/vipService.js";

export function initInternalApi(client) {
    const app = express();
    app.use(express.json());
    app.use(internalAuth);

    app.post("/internal/update-role", async (req, res) => {
        const { guildId, userId, roleName, action } = req.body;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return res.status(404).json({ error: "User not found" });
        const role = guild.roles.cache.find((r) => r.name === roleName);
        if (!role) return res.status(404).json({ error: "Role not found" });
        if (action === "remove") {
            await member.roles.remove(role);
        } else {
            await member.roles.add(role);
        }
        return res.json({ ok: true });
    });

    app.post("/internal/create-war", async (req, res) => {
        const { guildId, distritoA, distritoB } = req.body;
        try {
            const war = await challengeWar(guildId, distritoA, distritoB);
            return res.json({ ok: true, war });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    });

    app.post("/internal/finish-war", async (req, res) => {
        const { guildId, warId, winnerDistrictId, participants } = req.body;
        try {
            const war = await finalizeWar(guildId, warId, winnerDistrictId, participants || [], client.guilds.cache.get(guildId));
            return res.json({ ok: true, war });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    });

    app.post("/internal/create-mission", async (req, res) => {
        const { guildId, tipo, objetivo, recompensa } = req.body;
        const mission = await prisma.missao.create({
            data: { guildId, tipo, objetivo, recompensa, ativa: true }
        });
        return res.json({ ok: true, mission });
    });

    app.post("/internal/create-contract", async (req, res) => {
        const { guildId, distritoId, descricao, metaMensagens, metaRecrutas, recompensa, prazo } = req.body;
        const contract = await createContract(
            guildId,
            distritoId,
            descricao,
            metaMensagens,
            metaRecrutas,
            recompensa,
            prazo
        );
        return res.json({ ok: true, contract });
    });

    app.post("/internal/adjust-economy", async (req, res) => {
        const { guildId, userId, amount } = req.body;
        const user = await prisma.user.update({
            where: { guildId_discordId: { guildId, discordId: userId } },
            data: { dinheiro: { increment: Number(amount || 0) } }
        });
        return res.json({ ok: true, user });
    });

    app.post("/internal/vip/grant", async (req, res) => {
        const { guildId, userId, days, type } = req.body;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        const vip = await grantVip(guild, guildId, userId, Number(days || 7), type || "VIP");
        return res.json({ ok: true, vip });
    });

    app.post("/internal/vip/revoke", async (req, res) => {
        const { guildId, userId } = req.body;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        const vip = await revokeVip(guild, guildId, userId, "admin");
        return res.json({ ok: true, vip });
    });

    app.post("/internal/reset-season", async (req, res) => {
        const { guildId } = req.body;
        await endSeason(guildId);
        const season = await startSeason(guildId);
        return res.json({ ok: true, season });
    });

    app.post("/internal/promover", async (req, res) => {
        const { guildId, userId, roleName } = req.body;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return res.status(404).json({ error: "User not found" });
        const role = guild.roles.cache.find((r) => r.name === roleName);
        if (!role) return res.status(404).json({ error: "Role not found" });
        await member.roles.add(role);
        return res.json({ ok: true });
    });

    app.get("/internal/member/:id", async (req, res) => {
        const { id } = req.params;
        const guildId = req.query.guildId;
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        const member = await guild.members.fetch(id).catch(() => null);
        if (!member) return res.status(404).json({ error: "User not found" });
        const roles = member.roles.cache.map((r) => r.name);
        return res.json({ roles });
    });

    app.get("/internal/audit-logs", async (req, res) => {
        const { guildId, action, actorId, targetId, limit } = req.query;
        if (!guildId) return res.status(400).json({ error: "guildId is required" });
        const logs = await getAuditLogs(guildId, {
            action,
            actorId,
            targetId,
            limit: limit ? Number(limit) : undefined
        });
        return res.json({ logs });
    });

    app.get("/internal/contracts", async (req, res) => {
        const { guildId, distritoId } = req.query;
        if (!guildId) return res.status(400).json({ error: "guildId is required" });
        const contracts = await getActiveContracts(guildId, distritoId || undefined);
        return res.json({ contracts });
    });

    app.get("/internal/district-missions", async (req, res) => {
        const { guildId, distritoId } = req.query;
        if (!guildId || !distritoId) {
            return res.status(400).json({ error: "guildId and distritoId are required" });
        }
        const missions = await getActiveDistrictMissions(guildId, distritoId);
        return res.json({ missions });
    });

    const port = process.env.INTERNAL_API_PORT || 5050;
    app.listen(port, () => {
        console.log(`Internal API running on ${port}`);
    });
}
