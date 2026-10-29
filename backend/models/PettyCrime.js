// Petty Crime Reports model (table: petty_crimes).
// Field names map to what ResidentPettyCrimeModal.jsx sends via
// createPettyCrimeReport()/updatePettyCrimeReport() in Services/api.js.
const db = require("../config/db");

class PettyCrime {

    static async create(report) {
        const [result] = await db.query(
            `
            INSERT INTO petty_crimes
            (
                report_reference,
                reporter_id,
                crime_type,
                reporter_name,
                contact_number,
                location,
                latitude,
                longitude,
                description,
                suspect_info,
                photo_url,
                media_type,
                is_anonymous,
                report_for,
                victim_name,
                victim_contact,
                victim_relationship,
                victim_details,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                report.reportReference,
                report.reporterId || null,
                report.crimeType,
                report.reporterName,
                report.contactNumber || null,
                report.location,
                report.latitude || null,
                report.longitude || null,
                report.description,
                report.suspectInfo || null,
                report.photoUrl || null,
                report.mediaType || null,
                report.isAnonymous ? 1 : 0,
                report.reportFor || "self",
                report.victimName || null,
                report.victimContact || null,
                report.victimRelationship || null,
                report.victimDetails || null,
                "Received"
            ]
        );
        return result.insertId;
    }

    static async findAll(filters = {}) {
        let sql = `SELECT * FROM petty_crimes WHERE 1=1`;
        const values = [];

        if (filters.status) {
            sql += " AND status=?";
            values.push(filters.status);
        }

        // Date range from the Generate Report form (Date objects; `to` is exclusive).
        if (filters.from) {
            sql += " AND timestamp >= ?";
            values.push(filters.from);
        }
        if (filters.to) {
            sql += " AND timestamp < ?";
            values.push(filters.to);
        }

        sql += " ORDER BY timestamp DESC";
        const [rows] = await db.query(sql, values);
        return rows;
    }

    static async findByReporter(reporterId) {
        const [rows] = await db.query(
            `SELECT * FROM petty_crimes WHERE reporter_id = ? ORDER BY timestamp DESC`,
            [reporterId]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM petty_crimes WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    // Status changes only need these columns. findById also pulls the
    // photo/video (stored as base64 text), which can be several MB.
    static async findStatusById(id) {
        const [rows] = await db.query(
            `SELECT id, status, reporter_id FROM petty_crimes WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    // Whether a photo/video is already on file, without loading it.
    static async hasMedia(id) {
        const [rows] = await db.query(
            `SELECT photo_url IS NOT NULL AND photo_url <> '' AS has_media FROM petty_crimes WHERE id = ?`,
            [id]
        );
        return Boolean(rows[0]?.has_media);
    }

    static async update(id, report) {
        const [result] = await db.query(
            `
            UPDATE petty_crimes
            SET
                crime_type = ?,
                location = ?,
                latitude = ?,
                longitude = ?,
                description = ?,
                suspect_info = ?,
                photo_url = COALESCE(?, photo_url),
                media_type = COALESCE(?, media_type)
            WHERE id = ?
            `,
            [
                report.crimeType,
                report.location,
                report.latitude || null,
                report.longitude || null,
                report.description,
                report.suspectInfo || null,
                report.photoUrl || null,
                report.mediaType || null,
                id
            ]
        );
        return result.affectedRows;
    }

    // dismissalReason: only for status "Dismissed" (utils/statusWorkflow.js).
    static async updateStatus(id, status, dismissalReason = null) {
        const [result] = await db.query(
            // resolved_at (the closing time) starts the auto-archive countdown
            // for Resolved and Dismissed reports (services/archiveService.js).
            `UPDATE petty_crimes
             SET status = ?,
                 resolved_at = IF(? IN ('Resolved', 'Dismissed'), NOW(), resolved_at),
                 dismissal_reason = IF(? = 'Dismissed', ?, dismissal_reason)
             WHERE id = ?`,
            [status, status, status, dismissalReason, id]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM petty_crimes WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    static async getStatistics() {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalReports,
                SUM(status='Received') AS pending,
                SUM(status='In Progress') AS inProgress,
                SUM(status='Resolved') AS resolved,
                SUM(status='Cancelled') AS cancelled
            FROM petty_crimes
        `);
        return rows[0];
    }

    static async getLatestReference() {
        const [rows] = await db.query(`
            SELECT report_reference
            FROM petty_crimes
            WHERE report_reference IS NOT NULL
            ORDER BY id DESC
            LIMIT 1
        `);
        return rows[0];
    }
}

module.exports = PettyCrime;
