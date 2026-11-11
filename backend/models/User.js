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
            (full_name, username, contact_number, email_address, password, role, status, verification_status,
             address_house_number, address_street, address_area, birthdate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.fullName,
                user.username || null,
                user.contact || null,
                user.email,
                user.password,
                user.role || "resident",
                user.status || "Active",
                user.verificationStatus || null,
                user.address?.houseNumber || null,
                user.address?.street || null,
                user.address?.area || null,
                user.birthdate || null
            ]
        );

        return result.insertId;
    }

    // Resident ID verification. verification_status is Pending, Approved or
    // Rejected for accounts that signed up with an ID; NULL for older
    // accounts and staff, which need no review.
    static async ensureVerificationColumns() {
        const [existing] = await db.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registered_users'`
        );
        const have = new Set(existing.map((c) => c.name));
        for (const [name, definition] of [
            ["verification_status", "VARCHAR(20) DEFAULT NULL"],
            ["verification_note", "VARCHAR(500) DEFAULT NULL"],
            ["verified_at", "TIMESTAMP NULL DEFAULT NULL"],
            ["verified_by", "INT(11) DEFAULT NULL"],
            // The home address given at sign-up (Barangay Santa Fe).
            ["address_house_number", "VARCHAR(60) DEFAULT NULL"],
            ["address_street", "VARCHAR(120) DEFAULT NULL"],
            ["address_area", "VARCHAR(120) DEFAULT NULL"],
            // Given at sign-up; residents must be 15 or older.
            ["birthdate", "DATE DEFAULT NULL"]
        ]) {
            if (have.has(name)) continue;
            try {
                await db.query(`ALTER TABLE registered_users ADD COLUMN ${name} ${definition}`);
            } catch (err) {
                if (err.code !== "ER_DUP_FIELDNAME") throw err;
            }
        }
    }

    // Registrations for the Account Verification page, newest first, with
    // their ID's details (not the file itself) and who reviewed them.
    static async getVerifications(status) {
        const [rows] = await db.query(
            `SELECT u.id, u.full_name, u.username, u.contact_number, u.email_address,
                    u.address_house_number, u.address_street, u.address_area,
                    u.status, u.verification_status, u.verification_note, u.verified_at, u.created_at,
                    r.full_name AS verified_by_name,
                    d.id_type, d.file_name, d.mime_type, d.file_size, d.uploaded_at
             FROM registered_users u
             LEFT JOIN resident_id_documents d ON d.user_id = u.id
             LEFT JOIN registered_users r ON r.id = u.verified_by
             WHERE u.role = 'resident' AND u.verification_status ${status ? "= ?" : "IS NOT NULL"}
             ORDER BY u.created_at DESC`,
            status ? [status] : []
        );
        return rows;
    }

    // Approving activates the account; rejecting keeps it from signing in.
    // Only a registration still waiting is changed (0 rows: someone else decided).
    static async setVerification(id, { approved, note, adminId }) {
        const [result] = await db.query(
            `UPDATE registered_users
             SET verification_status = ?, verification_note = ?, verified_at = NOW(), verified_by = ?,
                 status = ?
             WHERE id = ? AND role = 'resident' AND verification_status = 'Pending'`,
            [approved ? "Approved" : "Rejected", note || null, adminId || null, approved ? "Active" : "Pending", id]
        );
        return result.affectedRows;
    }

    // A rejected registration doesn't hold on to its email or username, so
    // the person can sign up again with a better ID.
    static async deleteById(id) {
        await db.query(`DELETE FROM registered_users WHERE id = ?`, [id]);
    }

    static async deleteRejected(email, username) {
        const [result] = await db.query(
            `DELETE FROM registered_users
             WHERE verification_status = 'Rejected' AND role = 'resident'
               AND (email_address = ? OR (? IS NOT NULL AND username = ?))`,
            [email, username || null, username || null]
        );
        return result.affectedRows;
    }

    // Every signed-in request reads this, so it still works (without the
    // birthdate) in the moment after a restart before that column exists.
    // The birthdate comes back as "YYYY-MM-DD" text, not a time-zoned Date.
    static async findById(id) {
        const columns = `
                id, full_name, username, contact_number,
                email_address, role, status, photo_url, created_at,
                address_house_number, address_street, address_area`;
        try {
            const [rows] = await db.query(
                `SELECT ${columns}, DATE_FORMAT(birthdate, '%Y-%m-%d') AS birthdate
                 FROM registered_users WHERE id = ?`,
                [id]
            );
            return rows[0];
        } catch (err) {
            if (err.code !== "ER_BAD_FIELD_ERROR") throw err;
            const [rows] = await db.query(`SELECT ${columns} FROM registered_users WHERE id = ?`, [id]);
            return rows[0];
        }
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

    static async updateAddress(id, address) {
        const [result] = await db.query(
            `UPDATE registered_users SET address_house_number = ?, address_street = ?, address_area = ? WHERE id = ?`,
            [address.houseNumber, address.street, address.area || null, id]
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