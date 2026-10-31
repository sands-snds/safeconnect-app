const db = require("../config/db");
const AdminActivity = require("../models/AdminActivity");








const LOGS = {
    signin: { table: "signin_logs", dateCol: "timestamp", settingKey: "signin_log_auto_archive_days" },
    admin: { table: "admin_activity_logs", dateCol: "created_at", settingKey: "admin_log_auto_archive_days" }
};

const ALLOWED_DAYS = [0, 30, 90, 180, 365]; // 0 = off
const DEFAULT_DAYS = 90;


const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000;



async function ensureSchema() {
    await AdminActivity.ensureTable();
    await db.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(100) NOT NULL,
            setting_value VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    for (const { table, settingKey } of Object.values(LOGS)) {
        const [cols] = await db.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'archived_at'`,
            [table]
        );
        if (cols.length === 0) {
            await db.query(
                `ALTER TABLE ${table}
                 ADD COLUMN archived_at TIMESTAMP NULL DEFAULT NULL,
                 ADD KEY archived_at (archived_at)`
            );
        }
        await db.query(
            `INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
            [settingKey, String(DEFAULT_DAYS)]
        );
    }
}

async function getAutoArchiveDays(log) {
    const config = LOGS[log];
    if (!config) throw new Error(`Unknown log: ${log}`);
    const [rows] = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [config.settingKey]
    );
    const days = Number(rows[0]?.setting_value);
    return ALLOWED_DAYS.includes(days) ? days : DEFAULT_DAYS;
}

async function setAutoArchiveDays(log, days) {
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [LOGS[log].settingKey, String(days)]
    );
}



async function runAutoArchive(onlyLog = null) {
    let total = 0;
    for (const [key, { table, dateCol }] of Object.entries(LOGS)) {
        if (onlyLog && key !== onlyLog) continue;
        const days = await getAutoArchiveDays(key);
        if (!days) continue;
        const [result] = await db.query(
            `UPDATE ${table} SET archived_at = NOW()
             WHERE archived_at IS NULL AND ${dateCol} < NOW() - INTERVAL ? DAY`,
            [days]
        );
        total += result.affectedRows;
    }
    if (total) console.log(`Auto-archived ${total} log entr${total === 1 ? "y" : "ies"}.`);
    return total;
}

function startScheduler() {
    ensureSchema()
        .then(() => runAutoArchive())
        .catch((err) => console.error("Log archive setup failed:", err.message));

    setInterval(() => {
        runAutoArchive().catch((err) => console.error("Log auto-archive failed:", err.message));
    }, JOB_INTERVAL_MS).unref();
}

module.exports = {
    LOGS,
    ALLOWED_DAYS,
    getAutoArchiveDays,
    setAutoArchiveDays,
    runAutoArchive,
    startScheduler
};
