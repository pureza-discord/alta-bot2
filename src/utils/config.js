import { db } from '../database.js';

// IDs específicos do servidor
export const SERVER_CONFIG = {
    VERIFICATION_CHANNEL: '1460139282265018388',
    VERIFICATION_CATEGORY: '1460139202422509629',
    RECRUITMENT_CHANNEL: '1421608703882297496',
    TAG_CHANNEL: '1460434836895436894',
    NOTIFICATION_USER: '367813556554563594',
    ROLES: {
        CAPANGA: '1419309871656075397',
        FEMALE: '1457210009606688893',
        NAO_VERIFICADO: '1457231923830067325'
    },
    STAFF_ROLES: [
        '1428093853453389925',
        '1428094473904193628',
        '1375095425324814476',
        '1316963949001965668',
        '1375263517057220689',
        '1419308437744914563',
        '1423930370029650014',
        '1448683182370197524',
        '1422034993735274516',
        '1422034142165467258',
        '1428098619126321355'
    ]
};

export class ConfigManager {
    static async getGuildConfig(guildId) {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM guild_config WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        // Criar configuração padrão
                        const defaultConfig = {
                            guild_id: guildId,
                            verification_channel: SERVER_CONFIG.VERIFICATION_CHANNEL,
                            recruitment_channel: SERVER_CONFIG.RECRUITMENT_CHANNEL,
                            automod_enabled: 1,
                            antiraid_enabled: 1,
                            welcome_role: SERVER_CONFIG.ROLES.CAPANGA,
                            female_role: SERVER_CONFIG.ROLES.FEMALE
                        };
                        
                        this.createGuildConfig(defaultConfig).then(() => {
                            resolve(defaultConfig);
                        }).catch(reject);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }
    
    static async createGuildConfig(config) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO guild_config 
                (guild_id, verification_channel, recruitment_channel, log_channel, 
                 automod_enabled, antiraid_enabled, welcome_role, female_role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(query, [
                config.guild_id,
                config.verification_channel,
                config.recruitment_channel,
                config.log_channel,
                config.automod_enabled,
                config.antiraid_enabled,
                config.welcome_role,
                config.female_role
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }
    
    static async updateGuildConfig(guildId, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), guildId];
            
            db.run(
                `UPDATE guild_config SET ${fields} WHERE guild_id = ?`,
                values,
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.changes);
                    }
                }
            );
        });
    }
    
    static isStaffRole(roleIds) {
        if (!Array.isArray(roleIds)) {
            roleIds = [roleIds];
        }
        return roleIds.some(roleId => SERVER_CONFIG.STAFF_ROLES.includes(roleId));
    }
}
