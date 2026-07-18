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
            (full_name, username, contact_number, email_address, password)
            VALUES (?, ?, ?, ?, ?)`,
            [
                user.fullName,
                user.username,
                user.contact,
                user.email,
                user.password,
                user.role
            ]
        );

        return result.insertId;
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

        const allowedStatuses = [
            "Active",
            "Inactive",
            "Suspended"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }
    }

}

module.exports = User;