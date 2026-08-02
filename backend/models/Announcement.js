// Announcements model (table: announcements).
// Field names match what CreateAnnouncementView.jsx sends (via
// createAnnouncement()/updateAnnouncement() in Services/api.js) and what
// fetchAnnouncements() expects back.
const db = require("../config/db");

class Announcement {

    static async create(data) {
        const [result] = await db.query(
            `
            INSERT INTO announcements
            (
                title,
                category,
                message,
                date_posted,
                image_path,
                source_url,
                source_title,
                source_image,
                source_site,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                data.title,
                data.category,
                data.message,
                data.datePosted,
                data.imagePath || null,
                data.sourceUrl || null,
                data.sourceTitle || null,
                data.sourceImage || null,
                data.sourceSite || null,
                data.createdBy || null
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await db.query(`
            SELECT *
            FROM announcements
            ORDER BY created_at DESC
        `);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM announcements WHERE id=?`,
            [id]
        );
        return rows[0];
    }

    static async update(id, data) {
        const [result] = await db.query(
            `
            UPDATE announcements
            SET
                title=?,
                category=?,
                message=?,
                date_posted=?,
                image_path=COALESCE(?, image_path),
                source_url=?
            WHERE id=?
            `,
            [
                data.title,
                data.category,
                data.message,
                data.datePosted,
                data.imagePath || null,
                data.sourceUrl || null,
                id
            ]
        );
        return result.affectedRows;
    }

    static async clearImage(id) {
        const [result] = await db.query(
            `UPDATE announcements SET image_path = NULL WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM announcements WHERE id=?`,
            [id]
        );
        return result.affectedRows;
    }
}

module.exports = Announcement;
