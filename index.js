import { initBot } from "./src/bot/bot.js";

initBot().catch((err) => {
    console.error("Erro ao iniciar bot:", err);
});

