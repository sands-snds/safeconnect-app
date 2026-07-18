const db = require("../config/db");

class Announcement {

    static async create(data) {
        const [result] = await db.query(
            `
            INSERT INTO announcements
            (
                title,
                content,
                category,
                image_url,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                data.title,
                data.content,
                data.category,
                data.imageUrl,
                data.createdBy
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await db.query(`
            SELECT
                a.*,
                u.full_name AS author
            FROM announcements a
            LEFT JOIN registered_users u
                ON a.created_by = u.id
            WHERE a.is_published = TRUE
            ORDER BY a.created_at DESC
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
                content=?,
                category=?,
                image_url=?
            WHERE id=?
            `,
            [
                data.title,
                data.content,
                data.category,
                data.imageUrl,
                id
            ]
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