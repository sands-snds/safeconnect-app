const db = require("../config/db");

// Every admin action worth auditing (logins, status/role changes,
// announcements, exports...). Replaces the old admin_logs table, which only
// ever stored an email + login time.
class AdminActivity {

    // Created on server start so existing databases pick it up without a
    // manual migration (also listed in database/safeconnect_db.sql).
    static async ensureTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS admin_activity_logs (
                id INT(11) NOT NULL AUTO_INCREMENT,
                admin_id INT(11) DEFAULT NULL,
                admin_email VARCHAR(255) NOT NULL,
                admin_username VARCHAR(100) DEFAULT NULL,
                action VARCHAR(100) NOT NULL,
                details TEXT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY admin_id (admin_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
    }

    // admin: a registered_users row (id, email_address, username).
    static async record(admin, action, details = null) {
        if (!admin) return;
        await db.query(
            `INSERT INTO admin_activity_logs
            (admin_id, admin_email, admin_username, action, details)
            VALUES (?, ?, ?, ?, ?)`,
            [admin.id, admin.email_address, admin.username || null, action, details]
        );
    }

    // Newest first. Old entries are archived by services/logArchiveService.js;
    // archived: true lists those instead. role: the account's current role.
    // Optional filters (Generate Report): role, from / to (Date bounds,
    // `to` exclusive).
    static async getRecent(limit = 500, { archived = false, role, from, to } = {}) {
        let sql = `
            SELECT l.*, u.role
            FROM admin_activity_logs l
            LEFT JOIN registered_users u ON u.id = l.admin_id
            WHERE l.archived_at IS ${archived ? "NOT NULL" : "NULL"}
        `;
        const values = [];
        if (role) { sql += " AND u.role = ?"; values.push(role); }
        if (from) { sql += " AND l.created_at >= ?"; values.push(from); }
        if (to) { sql += " AND l.created_at < ?"; values.push(to); }
        sql += " ORDER BY l.id DESC LIMIT ?";
        values.push(limit);

        const [rows] = await db.query(sql, values);
        return rows;
    }

    // One row per current admin account with their last login and most
    // recent activity.
    static async getAdminSummaries() {
        const [rows] = await db.query(`
            SELECT
                u.id, u.full_name, u.username, u.email_address, u.role, u.status, u.photo_url,
                (
                    SELECT MAX(l.created_at) FROM admin_activity_logs l
                    WHERE l.admin_id = u.id AND l.action = 'Logged in'
                ) AS last_login,
                la.action     AS latest_action,
                la.details    AS latest_details,
                la.created_at AS latest_at
            FROM registered_users u
            LEFT JOIN admin_activity_logs la ON la.id = (
                SELECT l2.id FROM admin_activity_logs l2
                WHERE l2.admin_id = u.id
                ORDER BY l2.id DESC LIMIT 1
            )
            WHERE u.role IN ('admin', 'super_admin')
            ORDER BY la.created_at IS NULL, la.created_at DESC
        `);
        return rows;
    }
}

module.exports = AdminActivity;
