import { ActivityType } from "discord.js";

export const name = "ready";
export const once = true;

export async function execute(client) {
    console.log(`✅ Bot ${client.user.tag} está online!`);
    
    client.user.setPresence({
        activities: [{ name: "Alta Cúpula", type: ActivityType.Watching }],
        status: "online"
    });
    
    // Inicializar sistema de tags
    if (client.tagSystem) {
        await client.tagSystem.initialize();
    }
}

