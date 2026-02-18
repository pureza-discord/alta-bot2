import express from "express";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";
import { District, UserProfile, War } from "../services/databaseService.js";
import { info } from "../utils/logger.js";
import { getHistoricalLeaders } from "../services/hallOfFameService.js";

export function initApiServer() {
    const app = express();
    app.use(express.json());

    app.get("/api/ranking/districts", async (req, res) => {
        const ranking = await District.findAll({ order: [["points", "DESC"]], limit: 50 });
        res.json({ ranking });
    });

    app.get("/api/ranking/xp", async (req, res) => {
        const ranking = await UserProfile.findAll({ order: [["xp", "DESC"]], limit: 50 });
        res.json({ ranking });
    });

    app.get("/api/ranking/influence", async (req, res) => {
        const ranking = await UserProfile.findAll({ order: [["influence", "DESC"]], limit: 50 });
        res.json({ ranking });
    });

    app.get("/api/districts", async (req, res) => {
        const districts = await District.find().sort({ points: -1 });
        res.json({ districts });
    });

    app.get("/api/war/current", async (req, res) => {
        const currentWar = await War.findOne({ where: { status: "active" } });
        res.json({ currentWar });
    });

    app.get("/api/user/:id", async (req, res) => {
        const user = await UserProfile.findOne({ where: { userId: req.params.id } });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        res.json({ user });
    });

    app.get("/api/hall", async (req, res) => {
        const hall = await getHistoricalLeaders();
        res.json({ hall });
    });

    const port = Number(process.env.API_PORT || 3001);
    app.listen(port, () => {
        info(`API server iniciado na porta ${port}.`);
    });

    return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    initApiServer();
}
