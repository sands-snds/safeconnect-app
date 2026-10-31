const db = require("../config/db");
const { CLOSED_STATUSES } = require("../utils/statusWorkflow");

const REPORT_TABLES = {
    emergency: { table: "emergency_reports", createdCol: "time", label: "Emergency report" },
    assistance: { table: "assistance_requests", createdCol: "timestamp", label: "Assistance request" },
    pettyCrime: { table: "petty_crimes", createdCol: "timestamp", label: "Petty crime report" }
};

const SETTING_KEY = "report_auto_archive_months";
const ALLOWED_MONTHS = [0, 6, 12];
const DEFAULT_MONTHS = 12;

const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000;

const ARCHIVE_COLUMNS = {
    resolved_at: "TIMESTAMP NULL DEFAULT NULL",
    archived_at: "TIMESTAMP NULL DEFAULT NULL",

    dismissal_reason: "VARCHAR(500) DEFAULT NULL"
};

const REPORT_FOR_COLUMNS = {
    report_for: "VARCHAR(20) DEFAULT 'self'",
    victim_name: "VARCHAR(255) DEFAULT NULL",
    victim_contact: "VARCHAR(50) DEFAULT NULL",
    victim_relationship: "VARCHAR(100) DEFAULT NULL",
    victim_details: "TEXT DEFAULT NULL"
};

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

async function ensureSchema() {
    for (const { table } of Object.values(REPORT_TABLES)) {
        const [existing] = await db.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [table]
        );
        const have = new Set(existing.map((c) => c.name));

        if (have.has("rejection_reason") && !have.has("dismissal_reason")) {
            await db.query(`ALTER TABLE ${table} RENAME COLUMN rejection_reason TO dismissal_reason`);
            have.add("dismissal_reason");
        }
        await db.query(`UPDATE ${table} SET status = 'Dismissed' WHERE status = 'Rejected'`);
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

async function runAutoArchive() {
    const months = await getAutoArchiveMonths();
    if (!months) return 0;

    let total = 0;
    for (const { table, createdCol } of Object.values(REPORT_TABLES)) {
        const [result] = await db.query(
            `UPDATE ${table}
             SET archived_at = NOW()
             WHERE status IN ('Resolved', 'Dismissed')
               AND archived_at IS NULL
               AND COALESCE(resolved_at, ${createdCol}) < NOW() - INTERVAL ? MONTH`,
            [months]
        );
        total += result.affectedRows;
    }
    if (total) console.log(`Auto-archived ${total} closed report(s).`);
    return total;
}

async function setArchived(type, id, archived) {
    const config = REPORT_TABLES[type];
    if (!config) return { success: false, status: 400, message: "Unknown report type." };

    const [[report]] = await db.query(
        `SELECT id, status, archived_at FROM ${config.table} WHERE id = ?`,
        [id]
    );
    if (!report) return { success: false, status: 404, message: "Report not found." };

    if (archived && !CLOSED_STATUSES.includes(report.status)) {
        return { success: false, status: 400, message: "Only resolved or dismissed reports can be archived." };
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
