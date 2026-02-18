import { addMessageXP } from "../services/xpService.js";
import { getOrCreateUser, getUser } from "../services/core/userService.js";
import { checkPromotion } from "../services/core/promotionService.js";
import { addWarPoints as addCoreWarPoints } from "../services/core/warService.js";
import { trackMessage as trackMessageMetrics } from "../services/core/messageMetricsService.js";
import { addDistrictMissionProgress } from "../services/core/missionService.js";
import { addContractProgress } from "../services/core/contractService.js";

export const name = "messageCreate";

export async function execute(message, client) {
    if (!message.guild || message.author.bot) return;

    // Verificar AutoMod primeiro (se habilitado)
    if (client.automod) {
        const wasBlocked = await client.automod.checkMessage(message);
        if (wasBlocked) return; // Mensagem foi bloqueada pelo AutoMod
    }

    // Sistema de XP por mensagem (cooldown interno)
    try {
        await addMessageXP(message.author.id, message.guild.id);
    } catch (error) {
        console.error("Erro ao adicionar XP:", error);
    }

    let coreUser = null;
    try {
        await getOrCreateUser(message.guild.id, message.author.id, {
            username: message.author.username,
            avatar: message.author.displayAvatarURL()
        });
        coreUser = await getUser(message.guild.id, message.author.id);
        if (coreUser?.distritoId) {
            await addCoreWarPoints(message.guild.id, coreUser.distritoId, 1);
        }
        await checkPromotion(message.guild, message.author.id, message.guild.id);
    } catch (error) {
        console.error("Erro ao atualizar Prisma user:", error);
    }

    try {
        const categoryId = message.channel.parentId || null;
        await trackMessageMetrics({
            guildId: message.guild.id,
            userId: message.author.id,
            categoryId,
            districtId: coreUser?.distritoId || null,
            isReply: Boolean(message.reference),
            hasThread: Boolean(message.hasThread)
        });
    } catch (error) {
        console.error("Erro ao registrar métricas de mensagem:", error);
    }

    try {
        if (coreUser?.distritoId) {
            await addDistrictMissionProgress(message.guild.id, coreUser.distritoId, "season_messages", 1);
            await addContractProgress(message.guild.id, coreUser.distritoId, { mensagens: 1 });
        }
    } catch (error) {
        console.error("Erro ao atualizar progresso de missões/contratos:", error);
    }


    // Processar comandos com prefixo "."
    if (!message.content.startsWith(".")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Erro ao executar comando ${commandName}:`, error);
        message.reply("❌ Ocorreu um erro ao executar este comando.").catch(() => {});
    }
}

