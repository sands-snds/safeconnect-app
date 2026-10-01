const db = require("../config/db");

class AnnouncementLike {

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
