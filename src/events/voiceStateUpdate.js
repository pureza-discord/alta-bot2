import { db } from "../database.js";

export const name = "voiceStateUpdate";

export function execute(oldState, newState) {
    const user = newState.member?.user;
    const guild = newState.guild;

    if (!user || !guild) return;

    // Entrou na call
    if (!oldState.channelId && newState.channelId) {
        db.run(
            `INSERT INTO user_stats (user_id, guild_id, voice_join)
             VALUES (?, ?, ?)
             ON CONFLICT(user_id, guild_id)
             DO UPDATE SET voice_join = ?`,
            [user.id, guild.id, Date.now(), Date.now()],
            (err) => {
                if (err) console.error("Erro ao registrar entrada na call:", err);
            }
        );
    }

    // Saiu da call
    if (oldState.channelId && !newState.channelId) {
        db.get(
            `SELECT voice_join FROM user_stats WHERE user_id=? AND guild_id=?`,
            [user.id, guild.id],
            (err, row) => {
                if (err) {
                    console.error("Erro ao buscar voice_join:", err);
                    return;
                }

                if (!row || !row.voice_join) return;

                const tempo = Math.floor((Date.now() - row.voice_join) / 1000);

                db.run(
                    `UPDATE user_stats 
                     SET voice_time = voice_time + ?, voice_join = 0
                     WHERE user_id = ? AND guild_id = ?`,
                    [tempo, user.id, guild.id],
                    (err) => {
                        if (err) console.error("Erro ao atualizar tempo em call:", err);
                    }
                );
            }
        );
    }
}

