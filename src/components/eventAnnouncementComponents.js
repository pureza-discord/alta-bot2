import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildEmbed } from '../utils/embed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const EVENT_ANNOUNCE_BUTTON_ID = 'anunciar_evento';
export const EVENT_ANNOUNCE_MODAL_ID = 'event_announce_modal';

export const EVENT_ANNOUNCE_INPUTS = {
    TITLE: 'event_title',
    DESCRIPTION: 'event_description',
    DATE: 'event_date',
    TIME: 'event_time',
    LOCATION: 'event_location',
};

const EVENT_IMAGE_FILENAME = 'alta_famosos.png';
const EVENT_EMBED_COLOR = '#0f0f0f';

function getEmojiByName(guild, name) {
    if (!guild) return null;
    return guild.emojis.cache.find(emoji => emoji.name === name) ?? null;
}

function getEventImagePath() {
    return path.resolve(__dirname, '../../assets', EVENT_IMAGE_FILENAME);
}

export function createEventAssets() {
    return [new AttachmentBuilder(getEventImagePath())];
}

export function createEventContainerEmbed(guild) {
    const queensEmoji = getEmojiByName(guild, 'Queens');
    const queensText = queensEmoji ? queensEmoji.toString() : ':Queens:';

    return buildEmbed({
        title: `${queensText} EVENTOS ALTA`,
        description:
            'Central oficial de anúncios de eventos da Alta.\n\n' +
            'Clique no botão abaixo para anunciar um evento e notificar todos os membros do servidor.',
        color: EVENT_EMBED_COLOR,
        footerText: 'Alta • Sistema de Eventos',
        thumbnail: `attachment://${EVENT_IMAGE_FILENAME}`,
        image: `attachment://${EVENT_IMAGE_FILENAME}`
    });
}

export function createEventButtonRow(guild) {
    const button = new ButtonBuilder()
        .setCustomId(EVENT_ANNOUNCE_BUTTON_ID)
        .setLabel('Anunciar Evento')
        .setStyle(ButtonStyle.Primary);

    const buttonEmoji = getEmojiByName(guild, 'emoji_23');
    if (buttonEmoji) {
        button.setEmoji({ id: buttonEmoji.id, name: buttonEmoji.name });
    } else {
        console.warn('⚠️ Emoji personalizado "emoji_23" não encontrado.');
    }

    return new ActionRowBuilder().addComponents(button);
}

export function createEventModal() {
    const titleInput = new TextInputBuilder()
        .setCustomId(EVENT_ANNOUNCE_INPUTS.TITLE)
        .setLabel('Título do evento')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
        .setCustomId(EVENT_ANNOUNCE_INPUTS.DESCRIPTION)
        .setLabel('Descrição do evento')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

    const dateInput = new TextInputBuilder()
        .setCustomId(EVENT_ANNOUNCE_INPUTS.DATE)
        .setLabel('Data')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(64);

    const timeInput = new TextInputBuilder()
        .setCustomId(EVENT_ANNOUNCE_INPUTS.TIME)
        .setLabel('Horário')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(64);

    const locationInput = new TextInputBuilder()
        .setCustomId(EVENT_ANNOUNCE_INPUTS.LOCATION)
        .setLabel('Canal/Call (opcional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(128);

    return new ModalBuilder()
        .setCustomId(EVENT_ANNOUNCE_MODAL_ID)
        .setTitle('Anunciar Evento')
        .addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(dateInput),
            new ActionRowBuilder().addComponents(timeInput),
            new ActionRowBuilder().addComponents(locationInput),
        );
}

export function createEventDmEmbed({
    title,
    description,
    date,
    time,
    location,
}) {
    const lines = [
        '📣 Novo evento anunciado na Alta!',
        '',
        `🎬 **${title}**`,
        '',
        `📅 Data: ${date}`,
        `🕒 Horário: ${time}`,
        `📍 Local: ${location}`,
        '',
        description,
        '',
        '🔔 Participe e não fique de fora!'
    ];

    return buildEmbed({
        title: 'EVENTOS ALTA',
        description: lines.join('\n'),
        color: EVENT_EMBED_COLOR,
        footerText: 'Alta • Anúncio Oficial de Evento',
        image: `attachment://${EVENT_IMAGE_FILENAME}`
    });
}

