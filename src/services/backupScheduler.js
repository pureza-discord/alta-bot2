import cron from "node-cron";
import { BackupSystem } from "../systems/backup.js";
import { info, warn } from "../utils/logger.js";

const backupSystem = new BackupSystem();

export function initAutoBackup(client) {
    const schedule = process.env.BACKUP_CRON || "0 3 * * *";
    cron.schedule(schedule, async () => {
        for (const guild of client.guilds.cache.values()) {
            try {
                await backupSystem.createBackup(guild, client.user.id);
                info("auto_backup_complete", { guildId: guild.id });
            } catch (error) {
                warn("auto_backup_failed", { guildId: guild.id, error: error.message });
            }
        }
    });
}
