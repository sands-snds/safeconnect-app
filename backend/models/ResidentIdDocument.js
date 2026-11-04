const db = require("../config/db");

// The valid ID a resident uploads when signing up, kept in the database
// (not in the public uploads folder) and only sent to signed-in staff.
class ResidentIdDocument {
    static async ensureTable() {
        await db.query(`
            CREATE TABLE IF NOT EXISTS resident_id_documents (
                id INT(11) NOT NULL AUTO_INCREMENT,
                user_id INT(11) NOT NULL,
                id_type VARCHAR(60) DEFAULT NULL,
                file_name VARCHAR(255) DEFAULT NULL,
                mime_type VARCHAR(60) NOT NULL,
                file_size INT(11) NOT NULL,
                data MEDIUMBLOB NOT NULL,
                uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uniq_id_document_user (user_id),
                CONSTRAINT fk_id_document_user FOREIGN KEY (user_id) REFERENCES registered_users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
    }

    static async save(userId, doc) {
        await db.query(
            `INSERT INTO resident_id_documents (user_id, id_type, file_name, mime_type, file_size, data)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id_type = VALUES(id_type), file_name = VALUES(file_name),
                 mime_type = VALUES(mime_type), file_size = VALUES(file_size), data = VALUES(data),
                 uploaded_at = CURRENT_TIMESTAMP`,
            [userId, doc.idType || null, doc.fileName || null, doc.mimeType, doc.data.length, doc.data]
        );
    }

    static async findByUser(userId) {
        const [rows] = await db.query(
            `SELECT user_id, id_type, file_name, mime_type, file_size, data, uploaded_at
             FROM resident_id_documents WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    }

    static async deleteForUser(userId) {
        await db.query(`DELETE FROM resident_id_documents WHERE user_id = ?`, [userId]);
    }
}

module.exports = ResidentIdDocument;
