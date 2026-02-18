import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { loadDatabase } from "../database.js";
import { AutoMod } from "../systems/automod.js";
import { AntiRaid } from "../systems/antiraid.js";
import { TagSystem } from "../systems/tagSystem.js";
import { config } from "../config/index.js";
import { initJobs } from "../jobs/index.js";
import { info, error, registerGlobalErrorHandlers } from "../utils/logger.js";
import { initScheduler } from "../services/schedulerService.js";
import { prisma } from "../services/prisma.js";
import { initInternalApi } from "../services/internalApi.js";
import { initAutoBackup } from "../services/backupScheduler.js";
import { initUptimeMonitor } from "../services/uptimeMonitor.js";

dotenv.config();
registerGlobalErrorHandlers();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

async function loadCommands() {
    const commandsRoot = path.resolve(__dirname, "../commands");
    const folders = fs.readdirSync(commandsRoot);

    for (const folder of folders) {
        const folderPath = path.join(commandsRoot, folder);
        const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".js"));

        for (const file of files) {
            try {
                const command = await import(`../commands/${folder}/${file}`);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    info(`✅ Comando carregado: /${command.data.name}`);
                } else if (command.execute) {
                    const commandName = file.replace(".js", "");
                    client.commands.set(commandName, command);
                    info(`✅ Comando carregado: .${commandName} (prefix)`);
                }
            } catch (err) {
                error(`Erro ao carregar comando ${file}`, { error: err.message });
            }
        }
    }
}

async function loadEvents() {
    const eventsRoot = path.resolve(__dirname, "../events");
    const eventFiles = fs.readdirSync(eventsRoot).filter((f) => f.endsWith(".js"));

    for (const file of eventFiles) {
        try {
            const event = await import(`../events/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            info(`✅ Evento carregado: ${event.name}`);
        } catch (err) {
            error(`Erro ao carregar evento ${file}`, { error: err.message });
        }
    }
}

export async function initBot() {
    if (!config.token) {
        error("❌ DISCORD_TOKEN não encontrado no arquivo .env");
        process.exit(1);
    }

    loadDatabase();

    if (config.mongoURI) {
        try {
            await mongoose.connect(config.mongoURI);
            info("✅ MongoDB conectado com sucesso!");
        } catch (err) {
            error("Erro ao conectar ao MongoDB", { error: err.message });
        }
    } else {
        info("MongoDB não configurado. Ignorando conexão.");
    }

    try {
        await prisma.$connect();
        info("✅ Prisma conectado ao PostgreSQL.");
    } catch (err) {
        error("Erro ao conectar PostgreSQL", { error: err.message });
    }

    await loadCommands();
    await loadEvents();

    client.automod = new AutoMod();
    client.antiraid = new AntiRaid(client);
    client.tagSystem = new TagSystem(client);

    initJobs();
    initScheduler(client);
    initAutoBackup(client);
    initUptimeMonitor();

    setInterval(() => {
        client.antiraid.cleanupOldData();
        info("🧹 Limpeza de dados antigos executada");
    }, 6 * 60 * 60 * 1000);

    await client.login(config.token);
    initInternalApi(client);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    initBot().catch((err) => {
        console.error("Erro ao iniciar bot:", err);
        process.exit(1);
    });
}
