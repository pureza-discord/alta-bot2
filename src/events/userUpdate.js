import { db } from "../database.js";

export const name = "userUpdate";

export function execute(oldUser, newUser) {
    // Verificar mudanças de avatar
    if (oldUser.avatar !== newUser.avatar && newUser.avatar) {
        const avatarUrl = newUser.displayAvatarURL({ size: 1024, dynamic: true });
        db.run(
            `INSERT INTO user_history (user_id, guild_id, type, value, timestamp)
             VALUES (?, ?, 'avatar', ?, ?)`,
            [newUser.id, "global", avatarUrl, Date.now()],
            (err) => {
                if (err) console.error("Erro ao salvar histórico de avatar:", err);
            }
        );
    }

    // Verificar mudanças de banner
    if (oldUser.banner !== newUser.banner && newUser.banner) {
        const bannerUrl = newUser.bannerURL({ size: 1024, dynamic: true });
        if (bannerUrl) {
            db.run(
                `INSERT INTO user_history (user_id, guild_id, type, value, timestamp)
                 VALUES (?, ?, 'banner', ?, ?)`,
                [newUser.id, "global", bannerUrl, Date.now()],
                (err) => {
                    if (err) console.error("Erro ao salvar histórico de banner:", err);
                }
            );
        }
    }

    // Verificar mudanças de username
    if (oldUser.username !== newUser.username) {
        db.run(
            `INSERT INTO user_history (user_id, guild_id, type, value, timestamp)
             VALUES (?, ?, 'username', ?, ?)`,
            [newUser.id, "global", newUser.username, Date.now()],
            (err) => {
                if (err) console.error("Erro ao salvar histórico de username:", err);
            }
        );
    }
}

