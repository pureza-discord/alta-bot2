export async function sendAlert(title, description, meta = null) {
    const webhookUrl = process.env.DISCORD_ALERT_WEBHOOK;
    if (!webhookUrl) return false;
    const payload = {
        embeds: [
            {
                title,
                description,
                color: 0xff4d4d,
                timestamp: new Date().toISOString(),
                fields: meta
                    ? [
                          {
                              name: "Detalhes",
                              value: `\`\`\`json\n${JSON.stringify(meta, null, 2).slice(0, 1500)}\n\`\`\``
                          }
                      ]
                    : []
            }
        ]
    };
    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        return true;
    } catch (error) {
        console.error("Erro ao enviar alerta:", error);
        return false;
    }
}
