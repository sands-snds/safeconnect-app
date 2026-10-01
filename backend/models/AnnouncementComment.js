const db = require("../config/db");

class AnnouncementComment {

    static async create(announcementId, userId, text) {
        const [result] = await db.query(
            `INSERT INTO announcement_comments (announcement_id, user_id, comment_text) VALUES (?, ?, ?)`,
            [announcementId, userId, text]
        );
        return result.insertId;
    }

    // Joins the author's name so the News page doesn't need a second
    // round trip per comment to show who posted it.
    static async findByAnnouncement(announcementId) {
        const [rows] = await db.query(
            `
            SELECT c.id, c.announcement_id, c.user_id, c.comment_text, c.created_at,
                   u.full_name, u.username
            FROM announcement_comments c
            JOIN registered_users u ON u.id = c.user_id
            WHERE c.announcement_id = ?
            ORDER BY c.created_at ASC
            `,
            [announcementId]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(`SELECT * FROM announcement_comments WHERE id = ?`, [id]);
        return rows[0];
    }

    static async delete(id) {
        const [result] = await db.query(`DELETE FROM announcement_comments WHERE id = ?`, [id]);
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
