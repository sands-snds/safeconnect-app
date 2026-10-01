const db = require("../config/db");

class AnnouncementLike {

    // Created on server start so existing databases (including Azure) pick
    // it up without a manual migration -- same pattern as AdminActivity.
    // Also listed in database/safeconnect_db.sql.
    static async ensureTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS announcement_likes (
                id INT(11) NOT NULL AUTO_INCREMENT,
                announcement_id INT(11) NOT NULL,
                user_id INT(11) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uniq_announcement_user (announcement_id, user_id),
                KEY user_id (user_id),
                CONSTRAINT fk_like_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON DELETE CASCADE,
                CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES registered_users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
    }

    // Toggles the current user's like on an announcement. Returns the new
    // liked state (true = now liked, false = now unliked).
    static async toggle(announcementId, userId) {
        const [existing] = await db.query(
            `SELECT id FROM announcement_likes WHERE announcement_id = ? AND user_id = ?`,
            [announcementId, userId]
        );

        if (existing.length > 0) {
            await db.query(`DELETE FROM announcement_likes WHERE id = ?`, [existing[0].id]);
            return false;
        }

        await db.query(
            `INSERT INTO announcement_likes (announcement_id, user_id) VALUES (?, ?)`,
            [announcementId, userId]
        );
        return true;
    }

    static async countFor(announcementId) {
        const [[row]] = await db.query(
            `SELECT COUNT(*) AS count FROM announcement_likes WHERE announcement_id = ?`,
            [announcementId]
        );
        return row.count;
    }

    // Batched like counts for every announcement in one query, instead of
    // one query per card when rendering the News list.
    static async countsForAll() {
        const [rows] = await db.query(
            `SELECT announcement_id, COUNT(*) AS count FROM announcement_likes GROUP BY announcement_id`
        );
        const map = {};
        rows.forEach((r) => { map[r.announcement_id] = r.count; });
        return map;
    }

    static async likedAnnouncementIdsFor(userId) {
        if (!userId) return [];
        const [rows] = await db.query(
            `SELECT announcement_id FROM announcement_likes WHERE user_id = ?`,
            [userId]
        );
        return rows.map((r) => r.announcement_id);
    }
}

module.exports = AnnouncementLike;
