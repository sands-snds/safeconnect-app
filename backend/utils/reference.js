const db = require("../config/db");

// Report IDs: <type>-<year>-<6-digit number>, e.g. EM-2026-000041. Each
// report type has its own prefix and its own count, which restarts at 1 each
// year. Before November 2026 every type used "SC-" (renamed at startup by
// renameOldReferences below).
const PREFIX = { emergency: "EM", assistance: "AR", pettyCrime: "PC" };

const generateReference = async (getLatestFn, type) => {
    const prefix = PREFIX[type];
    if (!prefix) throw new Error(`Unknown report type: ${type}`);
    const year = new Date().getFullYear();
    const latest = await getLatestFn();
    let nextNumber = 1;
    if (latest && latest.report_reference) {
        const parts = latest.report_reference.split("-");
        if (parts.length === 3 && parts[1] === String(year)) {
            nextNumber = parseInt(parts[2], 10) + 1;
        }
    }
    return `${prefix}-${year}-${String(nextNumber).padStart(6, "0")}`;
};

// The old "SC-" IDs → the type's prefix: in the report tables, and where the
// activity logs mention them, so the logs still match the reports. Runs on
// every start; a database already renamed is left as it is.
const RENAMES = [
    { table: "emergency_reports", prefix: "EM", logLabel: "Emergency report", residentAction: "% emergency report" },
    { table: "assistance_requests", prefix: "AR", logLabel: "Assistance request", residentAction: "% assistance request" },
    { table: "petty_crimes", prefix: "PC", logLabel: "Petty crime report", residentAction: "% petty crime report" }
];

const renameOldReferences = async () => {
    for (const { table, prefix, logLabel, residentAction } of RENAMES) {
        await db.query(
            `UPDATE ${table} SET report_reference = CONCAT(?, SUBSTRING(report_reference, 3))
             WHERE report_reference LIKE 'SC-%'`,
            [prefix]
        );
        await db.query(
            `UPDATE admin_activity_logs SET details = REPLACE(details, ?, ?)
             WHERE details LIKE ?`,
            [`${logLabel} SC-`, `${logLabel} ${prefix}-`, `%${logLabel} SC-%`]
        );
        await db.query(
            `UPDATE resident_activity_logs SET details = CONCAT(?, SUBSTRING(details, 3))
             WHERE details LIKE 'SC-%' AND action LIKE ?`,
            [prefix, residentAction]
        );
    }
};

module.exports = { generateReference, renameOldReferences, PREFIX };
