import { REST, Routes } from "discord.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const commands = [];

async function loadCommands() {
    const folders = fs.readdirSync("./src/commands");
    
    for (const folder of folders) {
        const files = fs.readdirSync(`./src/commands/${folder}`).filter(f => f.endsWith(".js"));
        
        for (const file of files) {
            try {
                const command = await import(`./src/commands/${folder}/${file}`);
                if (command.data) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Comando registrado: ${command.data.name}`);
                }
            } catch (error) {
                console.error(`Erro ao carregar comando ${file}:`, error);
            }
        }
    }
}

async function deploy() {
    if (!process.env.DISCORD_TOKEN) {
        console.error("❌ DISCORD_TOKEN não encontrado no arquivo .env");
        process.exit(1);
    }

    if (!process.env.DISCORD_CLIENT_ID) {
        console.error("❌ DISCORD_CLIENT_ID não encontrado no arquivo .env");
        process.exit(1);
    }

    await loadCommands();
    
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log(`🔄 Registrando ${commands.length} slash commands...`);
        
        let route;
        let deployType;
        
        // Se DISCORD_GUILD_ID estiver definido, deploy no servidor específico (mais rápido)
        if (process.env.DISCORD_GUILD_ID) {
            route = Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID);
            deployType = `no servidor ${process.env.DISCORD_GUILD_ID}`;
        } else {
            // Deploy global (demora até 1 hora para aparecer)
            route = Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);
            deployType = "globalmente";
        }
        
        const data = await rest.put(route, { body: commands });
        
        console.log(`✅ ${data.length} slash commands registrados com sucesso ${deployType}!`);
        
        if (process.env.DISCORD_GUILD_ID) {
            console.log("⚡ Comandos disponíveis imediatamente no servidor!");
        } else {
            console.log("⏳ Comandos globais podem demorar até 1 hora para aparecer.");
        }
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
}

deploy();

