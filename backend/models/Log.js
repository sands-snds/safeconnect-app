const db = require("../config/db");

// Columns added to signin_logs after the original schema. ensureColumns()
// adds any that are missing when the server starts, so existing databases
// (local and Azure) don't need a manual migration.
const SIGNIN_EXTRA_COLUMNS = {
    ip_address: "VARCHAR(45) DEFAULT NULL",
    device: "VARCHAR(120) DEFAULT NULL",
    location: "VARCHAR(160) DEFAULT NULL"
};

class Log {
    static async ensureColumns() {
        const [existing] = await db.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'signin_logs'`
        );
        const have = new Set(existing.map((c) => c.name));
        for (const [name, definition] of Object.entries(SIGNIN_EXTRA_COLUMNS)) {
            if (!have.has(name)) {
                await db.query(`ALTER TABLE signin_logs ADD COLUMN ${name} ${definition}`);
            }
        }
    }

    // Records one sign-in attempt. ctx = { ip, device } from
    // utils/signinContext.js. Returns the new row's id.
    static async logSignin(fullName, email, status, ctx = {}) {
        try {
            const [result] = await db.query(
                `INSERT INTO signin_logs
                (full_name, email_address, status, ip_address, device)
                VALUES (?, ?, ?, ?, ?)`,
                [fullName, email, status, ctx.ip || null, ctx.device || null]
            );
            return result.insertId;
        } catch (err) {
            // Columns not added yet (ensureColumns still running or failed):
            // log without them rather than failing the sign-in.
            if (err.code !== "ER_BAD_FIELD_ERROR") throw err;
            const [result] = await db.query(
                `INSERT INTO signin_logs (full_name, email_address, status) VALUES (?, ?, ?)`,
                [fullName, email, status]
            );
            return result.insertId;
        }
    }

    static async setSigninLocation(id, location) {
        await db.query(`UPDATE signin_logs SET location = ? WHERE id = ?`, [location, id]);
    }

    // System > Sign-in Logs. Old entries are archived by
    // services/logArchiveService.js; archived: true lists those instead.
    // Optional filters (Generate Report): role ("unknown" = no account),
    // status, from / to (Date bounds, `to` exclusive).
    static async getSigninLogs({ archived = false, role, status, from, to } = {}) {
        // role: the account's current role, looked up by email (NULL for
        // failed attempts with an email that has no account).
        let sql = `
            SELECT s.*, u.role
            FROM signin_logs s
            LEFT JOIN registered_users u ON u.email_address = s.email_address
            WHERE s.archived_at IS ${archived ? "NOT NULL" : "NULL"}
        `;
        const values = [];
        if (role === "unknown") sql += " AND u.role IS NULL";
        else if (role) { sql += " AND u.role = ?"; values.push(role); }
        if (status) { sql += " AND s.status = ?"; values.push(status); }
        if (from) { sql += " AND s.timestamp >= ?"; values.push(from); }
        if (to) { sql += " AND s.timestamp < ?"; values.push(to); }
        sql += " ORDER BY s.id DESC";

        const [rows] = await db.query(sql, values);
        return rows;
    }

}
module.exports = Log;
