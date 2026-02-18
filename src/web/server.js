import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { prisma } from "../services/prisma.js";
import { errorHandler } from "../middlewares/errorHandler.js";

const WEB_PORT = process.env.WEB_PORT || 3000;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ error: "Não autenticado." });
}

export function initWebServer() {
    const app = express();
    app.use(express.json());
    app.use(
        cors({
            origin: process.env.WEB_ORIGIN || true,
            credentials: true
        })
    );

    app.use(
        session({
            secret: process.env.JWT_SECRET || "alta-core",
            resave: false,
            saveUninitialized: false
        })
    );
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new DiscordStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: process.env.REDIRECT_URI,
                scope: ["identify"]
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    await prisma.user.upsert({
                        where: { guildId_discordId: { guildId: profile.guildId || "global", discordId: profile.id } },
                        update: { username: profile.username, avatar: profile.avatar },
                        create: {
                            guildId: profile.guildId || "global",
                            discordId: profile.id,
                            username: profile.username,
                            avatar: profile.avatar
                        }
                    });
                    done(null, profile);
                } catch (err) {
                    done(err);
                }
            }
        )
    );

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    app.get("/login", passport.authenticate("discord"));

    app.get(
        "/callback",
        passport.authenticate("discord", { failureRedirect: "/login" }),
        (req, res) => {
            const token = jwt.sign(
                { id: req.user.id, username: req.user.username },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            res.cookie("token", token, { httpOnly: true });
            res.redirect("/dashboard");
        }
    );

    app.get("/logout", (req, res) => {
        req.logout(() => {
            res.clearCookie("token");
            res.redirect("/");
        });
    });

    app.get("/dashboard", ensureAuthenticated, async (req, res) => {
        const user = await prisma.user.findUnique({
            where: { guildId_discordId: { guildId: req.query.guildId || "global", discordId: req.user.id } }
        });
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
        res.json({
            foto: user.avatar,
            cargo: user.nivel,
            ranking: user.mensagens,
            distrito: user.distritoId,
            influencia: user.influencia,
            medalhas: [],
            historicoGuerra: [],
            missoes: [],
            economia: user.dinheiro
        });
    });

    app.use(errorHandler);
    app.listen(WEB_PORT, () => {
        console.log(`WEB running on ${WEB_PORT}`);
    });

    return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    initWebServer();
}
