const db = require("../config/db");
const live = require("../services/liveUpdates");

// Open pages reload their bell as soon as a notification is added or read.
const changedFor = (userId) => (userId ? live.notifyUser(userId, "notifications") : live.notifyAdmins("admin-notifications"));

class Notification {
    // archived_at: admin notifications archived from the Notifications page.
    // comment_id: for "announcement_comment", the comment to reply to.
    static async ensureColumns() {
        const [existing] = await db.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'`
        );
        const have = new Set(existing.map((c) => c.name));
        for (const [name, definition] of [["archived_at", "TIMESTAMP NULL DEFAULT NULL"], ["comment_id", "INT(11) DEFAULT NULL"]]) {
            if (have.has(name)) continue;
            try {
                await db.query(`ALTER TABLE notifications ADD COLUMN ${name} ${definition}`);
            } catch (err) {
                if (err.code !== "ER_DUP_FIELDNAME") throw err;
            }
        }
    }

    static async create(data) {
        const [result] = await db.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                notification_type,
                reference_id,
                comment_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,

            [
                data.userId || null,
                data.title,
                data.message,
                data.notificationType,
                data.referenceId,
                data.commentId || null
            ]
        );
        changedFor(data.userId || null);
        return result.insertId;
    }

    // Notifications for the admin panel (not tied to a specific resident).
    // archived: the Notifications page's Archived tab instead.
    static async findAll({ archived = false } = {}) {
        const [rows] = await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id IS NULL AND archived_at IS ${archived ? "NOT NULL" : "NULL"}
            ORDER BY created_at DESC
            `
        );
        return rows;
    }

    // Archive (or restore) admin notifications by id.
    static async setArchived(ids, archived) {
        if (!ids.length) return 0;
        const [result] = await db.query(
            `UPDATE notifications SET archived_at = ${archived ? "NOW()" : "NULL"}
             WHERE user_id IS NULL AND id IN (?)`,
            [ids]
        );
        changedFor(null);
        return result.affectedRows;
    }

    // Mark several admin notifications read.
    static async markManyAsRead(ids) {
        if (!ids.length) return 0;
        const [result] = await db.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id IS NULL AND id IN (?)`,
            [ids]
        );
        changedFor(null);
        return result.affectedRows;
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
            WHERE is_read = FALSE AND user_id IS NULL AND archived_at IS NULL
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
            WHERE is_read = FALSE AND user_id IS NULL AND archived_at IS NULL
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