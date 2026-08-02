const db = require("../config/db");

class User {

/* =========================================================
                    Find by Email
============================================================*/
    static async findByEmail(email) {

        const [rows] = await db.query(
            "SELECT * FROM registered_users WHERE email_address = ?",
            [email]
        );

        return rows[0];
    }

/* =========================================================
                    Find by Username
============================================================*/

    static async findByUsername(username) {

        const [rows] = await db.query(
            "SELECT * FROM registered_users WHERE username = ?",
            [username]
        );

        return rows[0];
    }

/* =========================================================
                    Create User
============================================================*/

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

/* =========================================================
                    Find by ID
============================================================*/

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

    // Includes the password hash — only for internal use (e.g. verifying
    // the current password before a change), never returned to the client.
    static async findByIdWithPassword(id) {
        const [rows] = await db.query(
            `SELECT * FROM registered_users WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

/* =========================================================
                    Profile Self-Service
============================================================*/

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
        return result.affectedRows;
    }

/* =========================================================
                    Log Signin Attempt
============================================================*/

    static async logSignin(fullName, email, status) {
        await db.query(
            `INSERT INTO signin_logs
            (full_name, email_address, status)
            VALUES (?, ?, ?)`,
            [fullName, email, status]
        );

    }

/* =========================================================
                    Log Admin Signin
============================================================*/

    static async logAdminSignin(email) {
        await db.query(
            `INSERT INTO admin_logs (email_address) VALUES (?)`,
            [email]
        );
    }

/* =========================================================
                    Get All Users
============================================================*/

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
                created_at
            FROM registered_users
            ORDER BY id DESC
            `
        );
        return rows;
    }

/* =========================================================
                    Update User Status
============================================================*/

    static async updateStatus(id, status) {
        const [result] = await db.query(
            `
            UPDATE registered_users
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );
        return result.affectedRows;
    }

}

module.exports = User;