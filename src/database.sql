-- Tabela de estatísticas de usuários
CREATE TABLE IF NOT EXISTS user_stats (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    messages INT DEFAULT 0,
    voice_time INT DEFAULT 0,
    voice_join BIGINT DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
);

-- Tabela de histórico de usuários (nomes, avatars, etc)
CREATE TABLE IF NOT EXISTS user_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    timestamp BIGINT NOT NULL
);

-- Tabela de recrutamento
CREATE TABLE IF NOT EXISTS recruitment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    recruiter_id TEXT NOT NULL,
    recruited_name TEXT NOT NULL,
    cargo_perm TEXT NOT NULL,
    gender TEXT NOT NULL,
    total INT DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at BIGINT DEFAULT (strftime('%s', 'now')),
    approved_by TEXT,
    approved_at BIGINT
);

-- Tabela de configurações do servidor
CREATE TABLE IF NOT EXISTS guild_config (
    guild_id TEXT PRIMARY KEY,
    verification_channel TEXT,
    recruitment_channel TEXT,
    log_channel TEXT,
    automod_enabled INTEGER DEFAULT 1,
    antiraid_enabled INTEGER DEFAULT 1,
    welcome_role TEXT,
    male_role TEXT,
    female_role TEXT,
    created_at BIGINT DEFAULT (strftime('%s', 'now'))
);

-- Tabela de logs de moderação
CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    duration INTEGER,
    timestamp BIGINT DEFAULT (strftime('%s', 'now'))
);

-- Tabela de backup de canais
CREATE TABLE IF NOT EXISTS channel_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    channel_type INTEGER NOT NULL,
    category_id TEXT,
    position INTEGER,
    permissions TEXT,
    created_at BIGINT DEFAULT (strftime('%s', 'now'))
);

-- Tabela de backup de cargos
CREATE TABLE IF NOT EXISTS role_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    color INTEGER,
    permissions TEXT,
    position INTEGER,
    mentionable INTEGER DEFAULT 0,
    hoist INTEGER DEFAULT 0,
    created_at BIGINT DEFAULT (strftime('%s', 'now'))
);

-- Tabela de infrações do automod
CREATE TABLE IF NOT EXISTS automod_infractions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    infraction_type TEXT NOT NULL,
    content TEXT,
    timestamp BIGINT DEFAULT (strftime('%s', 'now'))
);

-- Tabela de eventos suspeitos para anti-raid
CREATE TABLE IF NOT EXISTS raid_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    target_id TEXT,
    timestamp BIGINT DEFAULT (strftime('%s', 'now'))
);

