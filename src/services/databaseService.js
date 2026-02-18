import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";

const DB_PATH = path.resolve("data", "alta-core.sqlite");
const MIGRATIONS_DIR = path.resolve("src", "migrations");

if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: DB_PATH,
    logging: false
});

export const UserProfile = sequelize.define(
    "UserProfile",
    {
        userId: { type: DataTypes.STRING, allowNull: false },
        guildId: { type: DataTypes.STRING, allowNull: false },
        messages: { type: DataTypes.INTEGER, defaultValue: 0 },
        xp: { type: DataTypes.INTEGER, defaultValue: 0 },
        events: { type: DataTypes.INTEGER, defaultValue: 0 },
        recruits: { type: DataTypes.INTEGER, defaultValue: 0 },
        warPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
        warParticipations: { type: DataTypes.INTEGER, defaultValue: 0 },
        meritPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
        meritStars: { type: DataTypes.INTEGER, defaultValue: 0 },
        influence: { type: DataTypes.INTEGER, defaultValue: 0 },
        money: { type: DataTypes.INTEGER, defaultValue: 0 },
        currentRank: { type: DataTypes.STRING, defaultValue: "Capanga" },
        districtId: { type: DataTypes.STRING, defaultValue: null }
    },
    { tableName: "users", indexes: [{ fields: ["userId", "guildId"], unique: true }] }
);

export const District = sequelize.define(
    "District",
    {
        name: { type: DataTypes.STRING, unique: true },
        points: { type: DataTypes.INTEGER, defaultValue: 0 },
        captainId: { type: DataTypes.STRING, defaultValue: null },
        commander1Id: { type: DataTypes.STRING, defaultValue: null },
        commander2Id: { type: DataTypes.STRING, defaultValue: null },
        counselorId: { type: DataTypes.STRING, defaultValue: null }
    },
    { tableName: "districts" }
);

export const War = sequelize.define(
    "War",
    {
        districtAId: { type: DataTypes.STRING, allowNull: false },
        districtBId: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: "pending" },
        startDate: { type: DataTypes.DATE, defaultValue: null },
        endDate: { type: DataTypes.DATE, defaultValue: null },
        winnerDistrictId: { type: DataTypes.STRING, defaultValue: null }
    },
    { tableName: "wars" }
);

export const WarLog = sequelize.define(
    "WarLog",
    {
        warId: { type: DataTypes.INTEGER, allowNull: false },
        districtId: { type: DataTypes.STRING, allowNull: false },
        amount: { type: DataTypes.INTEGER, allowNull: false },
        reason: { type: DataTypes.STRING, allowNull: false }
    },
    { tableName: "war_logs" }
);

export const Season = sequelize.define(
    "Season",
    {
        number: { type: DataTypes.INTEGER, allowNull: false },
        note: { type: DataTypes.STRING, defaultValue: null }
    },
    { tableName: "seasons" }
);

export const PromotionLog = sequelize.define(
    "PromotionLog",
    {
        userId: { type: DataTypes.STRING, allowNull: false },
        guildId: { type: DataTypes.STRING, allowNull: false },
        fromRank: { type: DataTypes.STRING, allowNull: false },
        toRank: { type: DataTypes.STRING, allowNull: false },
        reason: { type: DataTypes.STRING, allowNull: false }
    },
    { tableName: "promotion_logs" }
);

export const MeritLog = sequelize.define(
    "MeritLog",
    {
        userId: { type: DataTypes.STRING, allowNull: false },
        guildId: { type: DataTypes.STRING, allowNull: false },
        delta: { type: DataTypes.INTEGER, allowNull: false },
        points: { type: DataTypes.INTEGER, allowNull: false },
        stars: { type: DataTypes.INTEGER, allowNull: false }
    },
    { tableName: "merit_logs" }
);

export const Event = sequelize.define(
    "Event",
    {
        title: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: "created" },
        createdBy: { type: DataTypes.STRING, allowNull: false },
        startedAt: { type: DataTypes.DATE, defaultValue: null },
        endedAt: { type: DataTypes.DATE, defaultValue: null }
    },
    { tableName: "events" }
);

export const EventParticipant = sequelize.define(
    "EventParticipant",
    {
        eventId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.STRING, allowNull: false }
    },
    { tableName: "event_participants" }
);

export const Recruitment = sequelize.define(
    "Recruitment",
    {
        recruiterId: { type: DataTypes.STRING, allowNull: false },
        newMemberId: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: "pending" }
    },
    { tableName: "recruitments" }
);

export const Punishment = sequelize.define(
    "Punishment",
    {
        userId: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
        reason: { type: DataTypes.STRING, defaultValue: null },
        duration: { type: DataTypes.INTEGER, defaultValue: null },
        active: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    { tableName: "punishments" }
);

export const CentralBank = sequelize.define(
    "CentralBank",
    {
        totalBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
        lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    { tableName: "central_bank" }
);

export async function runMigrations() {
    await sequelize.query(
        "CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, created_at TEXT)"
    );
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith(".sql"))
        .sort();
    for (const file of files) {
        const [results] = await sequelize.query(
            "SELECT name FROM migrations WHERE name = ?",
            { replacements: [file] }
        );
        if (results.length > 0) continue;
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
        const statements = sql.split(";").map((stmt) => stmt.trim()).filter(Boolean);
        for (const statement of statements) {
            await sequelize.query(statement);
        }
        await sequelize.query("INSERT INTO migrations (name, created_at) VALUES (?, ?)", {
            replacements: [file, new Date().toISOString()]
        });
    }
}

export async function initDatabase() {
    await sequelize.authenticate();
    await runMigrations();
}

export async function getOrCreateUser(userId, guildId) {
    const [user] = await UserProfile.findOrCreate({
        where: { userId, guildId },
        defaults: { userId, guildId }
    });
    return user;
}
