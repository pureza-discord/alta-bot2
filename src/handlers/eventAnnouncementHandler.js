import {
    createEventAssets,
    createEventButtonRow,
    createEventContainerEmbed,
    createEventDmEmbed,
    createEventModal,
    EVENT_ANNOUNCE_BUTTON_ID,
    EVENT_ANNOUNCE_INPUTS,
    EVENT_ANNOUNCE_MODAL_ID
} from '../components/eventAnnouncementComponents.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SERVER_CONFIG } from '../utils/config.js';

const DEFAULT_CHANNEL_ID = '1461809275860029597';
const MIN_DM_DELAY_MS = 1000;
const MAX_DM_DELAY_MS = 2000;
const CANCEL_DM_PREFIX = 'cancel_dm_send';
const activeDmBroadcasts = new Map();

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m${seconds.toString().padStart(2, '0')}s`;
}

function getEventChannelId() {
    return SERVER_CONFIG.EVENTS_CHANNEL || DEFAULT_CHANNEL_ID;
}

async function broadcastDm({ guild, embed, files = [], onProgress }) {
    const members = await guild.members.fetch();
    const targets = [...members.values()].filter(member => !member.user.bot);
    const total = targets.length;
    const delayMs = total <= 200 ? 600 : total <= 500 ? 800 : total <= 1000 ? 1000 : 1200;
    const maxTimeMs = 15 * 60 * 1000;
    const startedAt = Date.now();
    let sent = 0;
    let failed = 0;

    for (const member of targets) {
        if (onProgress?.isCancelled?.()) {
            break;
        }
        if (Date.now() - startedAt > maxTimeMs) {
            break;
        }

        try {
            await member.send({ embeds: [embed], files });
            sent += 1;
            console.log(`[DM OK] ${member.user.tag} (${member.id})`);
        } catch (error) {
            failed += 1;
            console.warn(`[DM FAIL] ${member.user.tag} (${member.id})`, error?.code ?? error?.message);
        }

        if (onProgress) {
            await onProgress({ sent, failed, total });
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));

        if (sent > 0 && sent % 25 === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return {
        sent,
        failed,
        total,
        cancelled: onProgress?.isCancelled?.() === true,
        timedOut: Date.now() - startedAt > maxTimeMs
    };
}

function createCancelRow(broadcastId) {
    const cancelButton = new ButtonBuilder()
        .setCustomId(`${CANCEL_DM_PREFIX}:${broadcastId}`)
        .setLabel('Parar envio')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder().addComponents(cancelButton);
}

export async function initializeEventAnnouncementContainer(client) {
    try {
        const channelId = getEventChannelId();
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            console.error(`❌ Canal de eventos ${channelId} não encontrado`);
            return;
        }

        const messages = await channel.messages.fetch({ limit: 50 });
        const botMessages = messages.filter(msg => msg.author.id === client.user.id);

        for (const message of botMessages.values()) {
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
        }

        await channel.send({
            embeds: [createEventContainerEmbed(channel.guild)],
            components: [createEventButtonRow(channel.guild)],
            files: createEventAssets()
        });

        console.log('✅ Container de eventos criado/atualizado');
    } catch (error) {
        console.error('❌ Erro ao inicializar container de eventos:', error);
    }
}

export async function handleEventAnnouncementInteraction(interaction) {
    if (interaction.isButton() && interaction.customId.startsWith(`${CANCEL_DM_PREFIX}:`)) {
        const [, broadcastId] = interaction.customId.split(':');
        const state = activeDmBroadcasts.get(broadcastId);
        if (!state) {
            await interaction.reply({ content: '❌ Nenhum envio ativo encontrado.', ephemeral: true }).catch(() => {});
            return true;
        }

        state.cancelled = true;
        await interaction.reply({ content: '⛔ Envio de DMs cancelado. Aguarde finalizar.', ephemeral: true }).catch(() => {});
        return true;
    }

    if (interaction.isButton() && interaction.customId === EVENT_ANNOUNCE_BUTTON_ID) {
        await interaction.showModal(createEventModal());
        return true;
    }

    if (interaction.isModalSubmit() && interaction.customId === EVENT_ANNOUNCE_MODAL_ID) {
        const title = interaction.fields.getTextInputValue(EVENT_ANNOUNCE_INPUTS.TITLE);
        const description = interaction.fields.getTextInputValue(EVENT_ANNOUNCE_INPUTS.DESCRIPTION);
        const date = interaction.fields.getTextInputValue(EVENT_ANNOUNCE_INPUTS.DATE);
        const time = interaction.fields.getTextInputValue(EVENT_ANNOUNCE_INPUTS.TIME);
        const location = interaction.fields.getTextInputValue(EVENT_ANNOUNCE_INPUTS.LOCATION);

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply('❌ Este comando só pode ser usado em servidor.');
            return true;
        }

        const testMode = process.env.TEST_MODE === 'true';
        if (testMode && interaction.member) {
            try {
                await interaction.member.send({
                    embeds: [
                        createEventDmEmbed({
                            title,
                            description,
                            date,
                            time,
                            location,
                        })
                    ],
                    files: createEventAssets()
                });
                await interaction.editReply('✅ Teste enviado apenas para você (TEST_MODE=true).');
            } catch (error) {
                await interaction.editReply('❌ Não foi possível enviar DM de teste.');
            }
            return true;
        }

        const embed = createEventDmEmbed({
            title,
            description,
            date,
            time,
            location,
        });
        const files = createEventAssets();
        const delay = Math.floor(Math.random() * (MAX_DM_DELAY_MS - MIN_DM_DELAY_MS + 1)) + MIN_DM_DELAY_MS;

        const broadcastId = interaction.id;
        const startedAt = Date.now();
        const cancelRow = createCancelRow(broadcastId);
        activeDmBroadcasts.set(broadcastId, {
            cancelled: false
        });

        await interaction.editReply({
            content: '📣 Evento em processamento. As DMs estão sendo enviadas...',
            components: [cancelRow]
        });

        setImmediate(async () => {
            try {
                let lastEditAt = 0;
                const state = activeDmBroadcasts.get(broadcastId);
                const result = await broadcastDm({
                    guild,
                    embed,
                    files,
                    onProgress: async ({ sent, failed, total }) => {
                        const now = Date.now();
                        const shouldUpdate = sent === 1 || sent % 10 === 0 || now - lastEditAt >= 5000;
                        if (!shouldUpdate) return;
                        lastEditAt = now;
                        await interaction.editReply(
                            '📣 Evento em processamento...\n' +
                            `📬 Enviadas: ${sent}/${total}\n` +
                            `❌ Falhas: ${failed}`
                        );
                    },
                    isCancelled: () => Boolean(state?.cancelled)
                });

                if (!interaction.ephemeral) {
                    return;
                }

                const finalHeader = result.cancelled
                    ? '⛔ Envio cancelado.\n\n'
                    : result.timedOut
                        ? '⚠️ Envio interrompido por tempo limite.\n\n'
                        : '📣 Evento anunciado com sucesso!\n\n';

                await interaction.editReply(
                    finalHeader +
                    `✅ DMs enviadas: ${result.sent}/${result.total}\n` +
                    `❌ Falhas (DM fechada): ${result.failed}\n` +
                    `⏱️ Tempo total: ${formatDuration(Date.now() - startedAt)}`
                );
            } catch (error) {
                console.error('Erro no envio em massa de DMs:', error);
                await interaction.editReply('❌ Ocorreu um erro ao enviar as DMs.');
            } finally {
                activeDmBroadcasts.delete(broadcastId);
                await interaction.editReply({ components: [] }).catch(() => {});
            }
        });

        return true;
    }

    return false;
}

