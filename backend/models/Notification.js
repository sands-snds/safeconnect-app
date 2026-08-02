const db = require("../config/db");

class Notification {
    static async create(data) {
        const [result] = await db.query(
            `
            INSERT INTO notifications
            (
                title,
                message,
                notification_type,
                reference_id
            )
            VALUES (?, ?, ?, ?)
            `,

            [
                data.title,
                data.message,
                data.notificationType,
                data.referenceId
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            ORDER BY created_at DESC
            `
        );
        return rows;
    }

    static async markAsRead(id) {
        const [result] = await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = ?
            `,
            [id]
        );
        return result.affectedRows;
    }

    static async unreadCount() {
        const [[row]] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE is_read = FALSE
            `
        );
        return row.total;
    }
}

module.exports = Notification;