const db = require("../config/db");

class AnnouncementComment {

    // Created on server start so existing databases (including Azure) pick
    // it up without a manual migration -- same pattern as AdminActivity.
    // Also listed in database/safeconnect_db.sql.
    static async ensureTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS announcement_comments (
                id INT(11) NOT NULL AUTO_INCREMENT,
                announcement_id INT(11) NOT NULL,
                user_id INT(11) NOT NULL,
                parent_id INT(11) DEFAULT NULL,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY announcement_id (announcement_id),
                KEY user_id (user_id),
                KEY parent_id (parent_id),
                CONSTRAINT fk_comment_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES registered_users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        // parent_id (replies) was added after the table first shipped; add it
        // to databases created before then.
        const [cols] = await db.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'announcement_comments' AND COLUMN_NAME = 'parent_id'`
        );
        if (cols.length === 0) {
            await db.query(
                `ALTER TABLE announcement_comments
                 ADD COLUMN parent_id INT(11) DEFAULT NULL AFTER user_id,
                 ADD KEY parent_id (parent_id)`
            );
        }
    }

    // parentId: the comment this one replies to (null for a top-level comment).
    static async create(announcementId, userId, text, parentId = null) {
        const [result] = await db.query(
            `INSERT INTO announcement_comments (announcement_id, user_id, parent_id, comment_text) VALUES (?, ?, ?, ?)`,
            [announcementId, userId, parentId, text]
        );
        return result.insertId;
    }

    // Joins the author's name and role so the News page and the admin panel
    // don't need a second round trip per comment to show who posted it.
    static async findByAnnouncement(announcementId) {
        const [rows] = await db.query(
            `
            SELECT c.id, c.announcement_id, c.user_id, c.parent_id, c.comment_text, c.created_at,
                   u.full_name, u.username, u.role
            FROM announcement_comments c
            JOIN registered_users u ON u.id = c.user_id
            WHERE c.announcement_id = ?
            ORDER BY c.created_at ASC, c.id ASC
            `,
            [announcementId]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(`SELECT * FROM announcement_comments WHERE id = ?`, [id]);
        return rows[0];
    }

    // Deleting a comment also deletes its replies.
    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM announcement_comments WHERE id = ? OR parent_id = ?`,
            [id, id]
        );
        return result.affectedRows;
    }

    static async countsForAll() {
        const [rows] = await db.query(
            `SELECT announcement_id, COUNT(*) AS count FROM announcement_comments GROUP BY announcement_id`
        );
        const map = {};
        rows.forEach((r) => { map[r.announcement_id] = r.count; });
        return map;
    }
}

module.exports = AnnouncementComment;
