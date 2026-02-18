import { sendAlert } from "../utils/alerts.js";
import { info } from "../utils/logger.js";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

export function initUptimeMonitor() {
    const pingUrl = process.env.UPTIME_PING_URL;
    const interval = Number(process.env.UPTIME_INTERVAL_MS || DEFAULT_INTERVAL_MS);
    if (!pingUrl) return;

    async function ping() {
        try {
            const res = await fetch(pingUrl, { method: "GET" });
            if (!res.ok) {
                await sendAlert("Uptime ping falhou", `Status ${res.status}`, { url: pingUrl });
            }
        } catch (error) {
            await sendAlert("Uptime ping falhou", "Erro de conexão", { url: pingUrl, error: error.message });
        }
    }

    setInterval(ping, interval);
    info("uptime_monitor_started", { pingUrl, interval });
}
