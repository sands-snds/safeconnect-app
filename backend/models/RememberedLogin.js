const crypto = require("crypto");
const db = require("../config/db");








const REMEMBER_DAYS = 30;

class RememberedLogin {
    static async ensureTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS remembered_logins (
                id CHAR(36) NOT NULL,
                user_id INT(11) NOT NULL,
                device VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                PRIMARY KEY (id),
                KEY user_id (user_id),
                CONSTRAINT fk_remembered_user FOREIGN KEY (user_id) REFERENCES registered_users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
    }

    
    static async create(userId, device) {
        const id = crypto.randomUUID();
        await db.query(
            `INSERT INTO remembered_logins (id, user_id, device, expires_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
            [id, userId, device ? String(device).slice(0, 255) : null, REMEMBER_DAYS]
        );
        return id;
    }

    static async isValid(id, userId) {
        const [rows] = await db.query(
            `SELECT 1 FROM remembered_logins WHERE id = ? AND user_id = ? AND expires_at > NOW()`,
            [id, userId]
        );
        return rows.length > 0;
    }

    static async delete(id) {
        await db.query(`DELETE FROM remembered_logins WHERE id = ?`, [id]);
    }

    static async deleteForUser(userId) {
        await db.query(`DELETE FROM remembered_logins WHERE user_id = ?`, [userId]);
    }

    static async deleteExpired() {
        await db.query(`DELETE FROM remembered_logins WHERE expires_at <= NOW()`);
    }
}

RememberedLogin.REMEMBER_DAYS = REMEMBER_DAYS;

module.exports = RememberedLogin;
