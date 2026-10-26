const db = require("../config/db");
const live = require("../services/liveUpdates");

// Open pages reload their bell as soon as a notification is added or read.
const changedFor = (userId) => (userId ? live.notifyUser(userId, "notifications") : live.notifyAdmins("admin-notifications"));

class Notification {
    static async create(data) {
        const [result] = await db.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                notification_type,
                reference_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,

            [
                data.userId || null,
                data.title,
                data.message,
                data.notificationType,
                data.referenceId
            ]
        );
        changedFor(data.userId || null);
        return result.insertId;
    }

    // Notifications for the admin panel (not tied to a specific resident).
    static async findAll() {
        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id IS NULL
            ORDER BY created_at DESC
            `
        );
        return rows;
    }

    // A resident's own personal notifications (e.g. status-change replies).
    static async findByUser(userId) {
        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [userId]
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
        changedFor(null);
        return result.affectedRows;
    }

    static async markAllAsRead() {
        const [result] = await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE is_read = FALSE AND user_id IS NULL
            `
        );
        changedFor(null);
        return result.affectedRows;
    }

    static async markAsReadForUser(id, userId) {
        const [result] = await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = ? AND user_id = ?
            `,
            [id, userId]
        );
        changedFor(userId);
        return result.affectedRows;
    }

    static async markAllAsReadForUser(userId) {
        const [result] = await db.query(
            `
            UPDATE notifications
            SET is_read = TRUE
            WHERE is_read = FALSE AND user_id = ?
            `,
            [userId]
        );
        changedFor(userId);
        return result.affectedRows;
    }

    static async unreadCount() {
        const [[row]] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE is_read = FALSE AND user_id IS NULL
            `
        );
        return row.total;
    }

    static async unreadCountForUser(userId) {
        const [[row]] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE is_read = FALSE AND user_id = ?
            `,
            [userId]
        );
        return row.total;
    }
}

module.exports = Notification;