import { addVoiceXP } from "../services/xpService.js";

export const name = "voiceStateUpdate";

const voiceJoins = new Map();

export function execute(oldState, newState) {
    const user = newState.member?.user;
    const guild = newState.guild;

    if (!user || !guild) return;

    // Entrou na call
    if (!oldState.channelId && newState.channelId) {
        voiceJoins.set(`${guild.id}:${user.id}`, Date.now());
    }

    // Saiu da call
    if (oldState.channelId && !newState.channelId) {
        const joinedAt = voiceJoins.get(`${guild.id}:${user.id}`);
        if (!joinedAt) return;
        voiceJoins.delete(`${guild.id}:${user.id}`);
        const tempo = Math.floor((Date.now() - joinedAt) / 1000);
        addVoiceXP(user.id, guild.id, tempo).catch((error) => {
            console.error("Erro ao adicionar XP por call:", error);
        });
    }
}

