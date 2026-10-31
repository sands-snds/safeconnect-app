const db = require("../config/db");

class ResidentActivity {
    static async ensureTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS resident_activity_logs (
                id INT(11) NOT NULL AUTO_INCREMENT,
                user_id INT(11) NOT NULL,
                email_address VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                details VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_resident_activity_email (email_address, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
    }

    static async record(userId, email, action, details = null) {
        await db.query(
            `INSERT INTO resident_activity_logs (user_id, email_address, action, details) VALUES (?, ?, ?, ?)`,
            [userId, email, action, details ? String(details).slice(0, 255) : null]
        );
    }

    static async forEmailsSince(emails, since) {
        if (!emails.length) return [];
        const [rows] = await db.query(
            `SELECT email_address, action, details, created_at
             FROM resident_activity_logs
             WHERE email_address IN (?) AND created_at >= ?
             ORDER BY created_at ASC, id ASC`,
            [emails, since]
        );
        return rows;
    }
}

module.exports = ResidentActivity;
