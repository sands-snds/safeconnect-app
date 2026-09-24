// Emergency Reports model (table: emergency_reports).
// Field names map to what ResidentEmergencyModal.jsx sends via
// createEmergencyReport()/updateEmergencyReport() in Services/api.js,
// via reportService.js's mapping.
const db = require("../config/db");

class Report {

    static async create(report) {
        const [result] = await db.query(
            `
            INSERT INTO emergency_reports
            (
                report_reference,
                reporter_id,
                emergency_type,
                severity,
                reporter_name,
                contact_number,
                location,
                latitude,
                longitude,
                incident_details,
                number_of_people_affected,
                special_needs,
                photo_url,
                media_type,
                report_for,
                victim_name,
                victim_contact,
                victim_relationship,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                report.reportReference,
                report.reporterId || null,
                report.emergencyType,
                report.severity,
                report.reporterName,
                report.contactNumber,
                report.location,
                report.latitude || null,
                report.longitude || null,
                report.details,
                report.peopleAffected || null,
                report.specialNeeds || null,
                report.photoUrl || null,
                report.mediaType || null,
                report.reportFor || "self",
                report.victimName || null,
                report.victimContact || null,
                report.victimRelationship || null,
                "Received"
            ]
        );
        return result.insertId;
    }

    static async findAll(filters = {}) {
        let sql = `
            SELECT *, reporter_name AS reporter, time AS created_at
            FROM emergency_reports
            WHERE 1=1
        `;
        const values = [];

        if (filters.status) {
            sql += " AND status=?";
            values.push(filters.status);
        }

        sql += " ORDER BY time DESC";
        const [rows] = await db.query(sql, values);
        return rows;
    }

    static async findByReporter(reporterId) {
        const [rows] = await db.query(
            `SELECT * FROM emergency_reports WHERE reporter_id = ? ORDER BY time DESC`,
            [reporterId]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM emergency_reports WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    // Status changes only need these columns. findById also pulls the
    // photo/video (stored as base64 text), which can be several MB.
    static async findStatusById(id) {
        const [rows] = await db.query(
            `SELECT id, status, reporter_id FROM emergency_reports WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async update(id, report) {
        const [result] = await db.query(
            `
            UPDATE emergency_reports
            SET
                emergency_type = ?,
                severity = ?,
                location = ?,
                latitude = ?,
                longitude = ?,
                incident_details = ?,
                number_of_people_affected = ?,
                special_needs = ?,
                photo_url = COALESCE(?, photo_url),
                media_type = COALESCE(?, media_type)
            WHERE id = ?
            `,
            [
                report.emergencyType,
                report.severity,
                report.location,
                report.latitude || null,
                report.longitude || null,
                report.details,
                report.peopleAffected || null,
                report.specialNeeds || null,
                report.photoUrl || null,
                report.mediaType || null,
                id
            ]
        );
        return result.affectedRows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            `UPDATE emergency_reports SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM emergency_reports WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    static async getStatistics() {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalReports,
                SUM(status='Pending') AS pending,
                SUM(status='Dispatched') AS dispatched,
                SUM(status='In Progress') AS inProgress,
                SUM(status='Resolved') AS resolved,
                SUM(status='Cancelled') AS cancelled
            FROM emergency_reports
        `);
        return rows[0];
    }

    static async getLatestReference() {
        const [rows] = await db.query(`
            SELECT report_reference
            FROM emergency_reports
            WHERE report_reference IS NOT NULL
            ORDER BY id DESC
            LIMIT 1
        `);
        return rows[0];
    }
}

module.exports = Report;
