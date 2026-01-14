import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { loadDatabase } from "./src/database.js";
import { AutoMod } from "./src/systems/automod.js";
import { AntiRaid } from "./src/systems/antiraid.js";
import { TagSystem } from "./src/systems/tagSystem.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
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

// Carregar comandos
async function loadCommands() {
    const folders = fs.readdirSync("./src/commands");
    
    for (const folder of folders) {
        const files = fs.readdirSync(`./src/commands/${folder}`).filter(f => f.endsWith(".js"));
        
        for (const file of files) {
            try {
                const command = await import(`./src/commands/${folder}/${file}`);
                if (command.data && command.execute) {
                    // Usar o nome do slash command
                    client.commands.set(command.data.name, command);
                    console.log(`✅ Comando carregado: /${command.data.name}`);
                } else if (command.execute) {
                    // Compatibilidade com comandos antigos (prefix)
                    const commandName = file.replace(".js", "");
                    client.commands.set(commandName, command);
                    console.log(`✅ Comando carregado: .${commandName} (prefix)`);
                }
            } catch (error) {
                console.error(`Erro ao carregar comando ${file}:`, error);
            }
        }
    }
}

// Carregar eventos
async function loadEvents() {
    const eventFiles = fs.readdirSync("./src/events").filter(f => f.endsWith(".js"));
    
    for (const file of eventFiles) {
        try {
            const event = await import(`./src/events/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            console.log(`✅ Evento carregado: ${event.name}`);
        } catch (error) {
            console.error(`Erro ao carregar evento ${file}:`, error);
        }
    }
}

// Inicializar
async function init() {
    if (!process.env.DISCORD_TOKEN) {
        console.error("❌ DISCORD_TOKEN não encontrado no arquivo .env");
        process.exit(1);
    }

    // Inicializar banco de dados
    loadDatabase();
    
    // Carregar comandos e eventos
    await loadCommands();
    await loadEvents();
    
    // Inicializar sistemas de segurança
    client.automod = new AutoMod();
    client.antiraid = new AntiRaid(client);
    
    // Inicializar sistema de tags
    client.tagSystem = new TagSystem(client);
    
    // Limpeza periódica de dados antigos (a cada 6 horas)
    setInterval(() => {
        client.antiraid.cleanupOldData();
        console.log('🧹 Limpeza de dados antigos executada');
    }, 6 * 60 * 60 * 1000);
    
    // Fazer login
    client.login(process.env.DISCORD_TOKEN);
}

init().catch(console.error);

