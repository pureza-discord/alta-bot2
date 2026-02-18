import { ActivityType } from "discord.js";
import { initializeEventAnnouncementContainer } from "../handlers/eventAnnouncementHandler.js";
import { initCron } from "../services/core/schedulerService.js";

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

    await initializeEventAnnouncementContainer(client);

    for (const guild of client.guilds.cache.values()) {
        initCron(guild);
    }
}

