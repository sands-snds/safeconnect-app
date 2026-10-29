const db = require("../config/db");
const { CLOSED_STATUSES } = require("../utils/statusWorkflow");

// Report archiving. A Resolved or Rejected report can be archived by hand from
// its card, and the scheduled job below archives them automatically once
// they have been closed for longer than the configured period
// (Off / 6 months / 1 year, stored in system_settings). Archived reports stay
// in their tables with archived_at set -- they're hidden from the admin
// report lists (shown under "Archived" instead) but still count on the
// dashboard and in exports, and can be restored.

// type: the key the frontend uses (see api.js's updateStatus).
const REPORT_TABLES = {
    emergency: { table: "emergency_reports", createdCol: "time", label: "Emergency report" },
    assistance: { table: "assistance_requests", createdCol: "timestamp", label: "Assistance request" },
    pettyCrime: { table: "petty_crimes", createdCol: "timestamp", label: "Petty crime report" }
};

const SETTING_KEY = "report_auto_archive_months";
const ALLOWED_MONTHS = [0, 6, 12];
const DEFAULT_MONTHS = 12;

// Auto-archive runs on start and then every 6 hours.
const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000;

const ARCHIVE_COLUMNS = {
    resolved_at: "TIMESTAMP NULL DEFAULT NULL",
    archived_at: "TIMESTAMP NULL DEFAULT NULL",
    // Why an Official/Admin rejected the report (status "Rejected").
    rejection_reason: "VARCHAR(500) DEFAULT NULL"
};

// "Reporting for someone else" fields the report forms send. The models
// insert all of them, so a missing one (victim_details was never added to
// existing databases) made every resident report fail to submit.
const REPORT_FOR_COLUMNS = {
    report_for: "VARCHAR(20) DEFAULT 'self'",
    victim_name: "VARCHAR(255) DEFAULT NULL",
    victim_contact: "VARCHAR(50) DEFAULT NULL",
    victim_relationship: "VARCHAR(100) DEFAULT NULL",
    victim_details: "TEXT DEFAULT NULL"
};

// Photo/video attachment, stored as base64 like emergency_reports.photo_url.
const MEDIA_COLUMNS = {
    photo_url: "LONGTEXT DEFAULT NULL",
    media_type: "VARCHAR(20) DEFAULT NULL"
};

// Columns only some report tables have.
const TABLE_EXTRA_COLUMNS = {
    // + the "report anonymously" flag
    petty_crimes: { ...MEDIA_COLUMNS, is_anonymous: "TINYINT(1) NOT NULL DEFAULT 0" },
    // + "Victim of What Emergency?"
    assistance_requests: { ...MEDIA_COLUMNS, victim_of_emergency: "VARCHAR(255) DEFAULT NULL" }
};

// Adds the report-for / victim columns and archived_at / resolved_at to the
// report tables and creates the settings table, so existing databases (local
// and Azure) don't need a manual migration.
async function ensureSchema() {
    for (const { table } of Object.values(REPORT_TABLES)) {
        const [existing] = await db.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table]
        );
        const have = new Set(existing.map((c) => c.name));
        const columns = {
            ...REPORT_FOR_COLUMNS,
            ...ARCHIVE_COLUMNS,
            ...TABLE_EXTRA_COLUMNS[table]
        };
        for (const [name, definition] of Object.entries(columns)) {
            if (!have.has(name)) {
                try {
                    await db.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
                } catch (err) {
                    // Another server instance added it first (e.g. two
                    // starting at once) -- that's the outcome we wanted.
                    if (err.code !== "ER_DUP_FIELDNAME") throw err;
                }
            }
        }
    }

    await db.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(100) NOT NULL,
            setting_value VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
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

// Archives Resolved/Rejected reports closed more than `months` ago. Reports
// closed before resolved_at existed fall back to when they were submitted.
async function runAutoArchive() {
    const months = await getAutoArchiveMonths();
    if (!months) return 0;

    let total = 0;
    for (const { table, createdCol } of Object.values(REPORT_TABLES)) {
        const [result] = await db.query(
            `UPDATE ${table}
             SET archived_at = NOW()
             WHERE status IN ('Resolved', 'Rejected')
               AND archived_at IS NULL
               AND COALESCE(resolved_at, ${createdCol}) < NOW() - INTERVAL ? MONTH`,
            [months]
        );
        total += result.affectedRows;
    }
    if (total) console.log(`Auto-archived ${total} closed report(s).`);
    return total;
}

// archived: true to archive, false to restore. Only Resolved and Rejected
// reports can be archived. Returns { success, status?, message? }.
async function setArchived(type, id, archived) {
    const config = REPORT_TABLES[type];
    if (!config) return { success: false, status: 400, message: "Unknown report type." };

    const [[report]] = await db.query(
        `SELECT id, status, archived_at FROM ${config.table} WHERE id = ?`,
        [id]
    );
    if (!report) return { success: false, status: 404, message: "Report not found." };

    if (archived && !CLOSED_STATUSES.includes(report.status)) {
        return { success: false, status: 400, message: "Only resolved or rejected reports can be archived." };
    }

    await db.query(
        `UPDATE ${config.table} SET archived_at = ${archived ? "NOW()" : "NULL"} WHERE id = ?`,
        [id]
    );
    return { success: true };
}

function startScheduler() {
    ensureSchema()
        .then(runAutoArchive)
        .catch((err) => console.error("Report archive setup failed:", err.message));

    setInterval(() => {
        runAutoArchive().catch((err) => console.error("Auto-archive failed:", err.message));
    }, JOB_INTERVAL_MS).unref();
}

module.exports = {
    REPORT_TABLES,
    ALLOWED_MONTHS,
    getAutoArchiveMonths,
    setAutoArchiveMonths,
    runAutoArchive,
    setArchived,
    startScheduler
};
