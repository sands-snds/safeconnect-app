const db = require("../config/db");

// Announcement archiving (Content > Announcements). An announcement can be
// archived by hand (from its Edit form), and the scheduled job below
// archives announcements automatically once they were posted longer ago than
// the configured period (Off / 3 months / 6 months / 1 year, stored in
// system_settings; Off by default). Archived announcements stay in the
// table with archived_at set: residents and the landing page no longer see
// them, Admins and Officials find them under "Archived" and can restore them.

const SETTING_KEY = "announcement_auto_archive_months";
const ALLOWED_MONTHS = [0, 3, 6, 12];
const DEFAULT_MONTHS = 0;

// Runs on start and then every 6 hours.
const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function ensureSchema() {
    const [existing] = await db.query(
        `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'announcements' AND COLUMN_NAME = 'archived_at'`
    );
    if (!existing.length) {
        try {
            await db.query(`ALTER TABLE announcements ADD COLUMN archived_at TIMESTAMP NULL DEFAULT NULL`);
        } catch (err) {
            if (err.code !== "ER_DUP_FIELDNAME") throw err;
        }
    }
    // system_settings is created by archiveService.ensureSchema / siteContentService.
    await db.query(
        `INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
        [SETTING_KEY, String(DEFAULT_MONTHS)]
    );
}

async function getAutoArchiveMonths() {
    const [rows] = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [SETTING_KEY]
    );
    const months = Number(rows[0]?.setting_value);
    return ALLOWED_MONTHS.includes(months) ? months : DEFAULT_MONTHS;
}

async function setAutoArchiveMonths(months) {
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [SETTING_KEY, String(months)]
    );
}

// Archives announcements posted more than `months` ago. Returns how many.
async function runAutoArchive() {
    const months = await getAutoArchiveMonths();
    if (!months) return 0;
    const [result] = await db.query(
        `UPDATE announcements SET archived_at = NOW()
         WHERE archived_at IS NULL AND created_at < NOW() - INTERVAL ? MONTH`,
        [months]
    );
    if (result.affectedRows) console.log(`Auto-archived ${result.affectedRows} announcement(s).`);
    return result.affectedRows;
}

// archived: true to archive, false to restore. Returns affected rows.
async function setArchived(id, archived) {
    const [result] = await db.query(
        `UPDATE announcements SET archived_at = ${archived ? "NOW()" : "NULL"} WHERE id = ?`,
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
    ALLOWED_MONTHS,
    getAutoArchiveMonths,
    setAutoArchiveMonths,
    runAutoArchive,
    setArchived,
    startScheduler
};
