const db = require("../config/db");

class User {
    static async findByEmail(email) {
        const [rows] = await db.query(
            "SELECT * FROM registered_users WHERE email_address = ?",
            [email]
        );

        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await db.query(
            "SELECT * FROM registered_users WHERE username = ?",
            [username]
        );

        return rows[0];
    }

    static async create(user) {
        const [result] = await db.query(
            `INSERT INTO registered_users
            (full_name, username, contact_number, email_address, password, role)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user.fullName,
                user.username || null,
                user.contact || null,
                user.email,
                user.password,
                user.role || "resident"
            ]
        );

        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `
            SELECT
                id, full_name, username, contact_number,
                email_address, role, status, photo_url, created_at
            FROM registered_users
            WHERE id = ?
            `,
            [id]
        );
        return rows[0];
    }

    static async findByIdWithPassword(id) {
        const [rows] = await db.query(
            `SELECT * FROM registered_users WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async updatePhoto(id, photoUrl) {
        const [result] = await db.query(
            `UPDATE registered_users SET photo_url = ? WHERE id = ?`,
            [photoUrl, id]
        );
        return result.affectedRows;
    }

    static async updateUsername(id, username) {
        const [result] = await db.query(
            `UPDATE registered_users SET username = ? WHERE id = ?`,
            [username, id]
        );
        return result.affectedRows;
    }

    static async updatePassword(id, hashedPassword) {
        const [result] = await db.query(
            `UPDATE registered_users SET password = ? WHERE id = ?`,
            [hashedPassword, id]
        );
        await require("./RememberedLogin").deleteForUser(id);
        return result.affectedRows;
    }

    static async updateFullName(id, fullName) {
        const [result] = await db.query(
            `UPDATE registered_users SET full_name = ? WHERE id = ?`,
            [fullName, id]
        );
        return result.affectedRows;
    }

    static async updateContact(id, contact) {
        const [result] = await db.query(
            `UPDATE registered_users SET contact_number = ? WHERE id = ?`,
            [contact, id]
        );
        return result.affectedRows;
    }

    static async updateEmail(id, email) {
        const [result] = await db.query(
            `UPDATE registered_users SET email_address = ? WHERE id = ?`,
            [email, id]
        );
        return result.affectedRows;
    }

    static async getAll() {
        const [rows] = await db.query(
            `
            SELECT
                id,
                full_name,
                username,
                contact_number,
                email_address,
                role,
                status,
                created_at,
                archived_at
            FROM registered_users
            ORDER BY id DESC
            `
        );
        return rows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            `
            UPDATE registered_users
            SET status = ?, archived_at = IF(? = 'Closed', archived_at, NULL)
            WHERE id = ?
            `,
            [status, status, id]
        );
        return result.affectedRows;
    }

    static async ensureArchiveColumn() {
        const [cols] = await db.query(
            `SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registered_users' AND COLUMN_NAME = 'archived_at'`
        );
        if (cols.length) return;
        try {
            await db.query(`ALTER TABLE registered_users ADD COLUMN archived_at TIMESTAMP NULL DEFAULT NULL`);
        } catch (err) {
            if (err.code !== "ER_DUP_FIELDNAME") throw err;
        }
    }

    static async setArchived(id, archived) {
        const [result] = await db.query(
            `UPDATE registered_users SET archived_at = ${archived ? "NOW()" : "NULL"} WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    static async updateRole(id, role) {
        const [result] = await db.query(
            `UPDATE registered_users SET role = ? WHERE id = ?`,
            [role, id]
        );
        return result.affectedRows;
    }
}

module.exports = User;