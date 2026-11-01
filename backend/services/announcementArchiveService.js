const db = require("../config/db");
const live = require("./liveUpdates");

// How many days after it's posted an announcement moves to Archived (and off
// the residents' News page). 7 is the weekly News reset; 0 turns it off.
const SETTING_KEY = "announcement_auto_archive_days";
const ALLOWED_DAYS = [0, 7, 90, 180, 365];
const DEFAULT_DAYS = 7;

// Hourly, so an announcement leaves the News page within an hour of turning 7 days old.
const JOB_INTERVAL_MS = 60 * 60 * 1000;

async function ensureSchema() {
    // restored_at: a restored announcement gets a fresh period from then,
    // instead of being archived again by the next run.
    const [existing] = await db.query(
        `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'announcements' AND COLUMN_NAME IN ('archived_at', 'restored_at')`
    );
    const have = new Set(existing.map((c) => c.name));
    for (const column of ["archived_at", "restored_at"]) {
        if (have.has(column)) continue;
        try {
            await db.query(`ALTER TABLE announcements ADD COLUMN ${column} TIMESTAMP NULL DEFAULT NULL`);
        } catch (err) {
            if (err.code !== "ER_DUP_FIELDNAME") throw err;
        }
    }

    // Replaces the older months setting ("announcement_auto_archive_months"),
    // starting on the weekly reset.
    await db.query(
        `INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
        [SETTING_KEY, String(DEFAULT_DAYS)]
    );
}

async function getAutoArchiveDays() {
    const [rows] = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [SETTING_KEY]
    );
    const days = Number(rows[0]?.setting_value);
    return ALLOWED_DAYS.includes(days) ? days : DEFAULT_DAYS;
}

async function setAutoArchiveDays(days) {
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [SETTING_KEY, String(days)]
    );
}

async function runAutoArchive() {
    const days = await getAutoArchiveDays();
    if (!days) return 0;
    const [result] = await db.query(
        `UPDATE announcements SET archived_at = NOW()
         WHERE archived_at IS NULL
           AND GREATEST(created_at, COALESCE(restored_at, created_at)) < NOW() - INTERVAL ? DAY`,
        [days]
    );
    if (result.affectedRows) {
        console.log(`Auto-archived ${result.affectedRows} announcement(s).`);
        live.notifyAll("announcements");
    }
    return result.affectedRows;
}

async function setArchived(id, archived) {
    const [result] = await db.query(
        archived
            ? `UPDATE announcements SET archived_at = NOW() WHERE id = ?`
            : `UPDATE announcements SET archived_at = NULL, restored_at = NOW() WHERE id = ?`,
        [id]
    );
    return result.affectedRows;
}

function startScheduler() {
    ensureSchema()
        .then(runAutoArchive)
        .catch((err) => console.error("Announcement archive setup failed:", err.message));
    setInterval(() => {
        runAutoArchive().catch((err) => console.error("Announcement auto-archive failed:", err.message));
    }, JOB_INTERVAL_MS).unref();
}

module.exports = {
    ALLOWED_DAYS,
    getAutoArchiveDays,
    setAutoArchiveDays,
    runAutoArchive,
    setArchived,
    startScheduler
};
