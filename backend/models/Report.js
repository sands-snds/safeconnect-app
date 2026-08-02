// Emergency Reports model (table: emergency_reports).
// Field names here match what ResidentEmergencyModal.jsx actually sends
// via createEmergencyReport()/updateEmergencyReport() in Services/api.js.
const db = require("../config/db");

class Report {

    // Create a new emergency report
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
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                report.peopleAffected || 0,
                report.specialNeeds || null,
                report.photoUrl || null,
                report.mediaType || null,
                "Received"
            ]
        );
        return result.insertId;
    }

    // Get all emergency reports (with optional filters)
    static async findAll(filters = {}) {
        let sql = `SELECT * FROM emergency_reports WHERE 1=1`;

        const values = [];
        if (filters.status) {
            sql += " AND status=?";
            values.push(filters.status);
        }

        if (filters.type) {
            sql += " AND emergency_type=?";
            values.push(filters.type);
        }

        if (filters.from) {
            sql += " AND DATE(time)>=?";
            values.push(filters.from);
        }

        if (filters.to) {
            sql += " AND DATE(time)<=?";
            values.push(filters.to);
        }

        sql += " ORDER BY time DESC";
        const [rows] = await db.query(sql, values);
        return rows;
    }

    // Get all reports submitted by a specific resident
    static async findByReporter(reporterId) {
        const [rows] = await db.query(
            `SELECT * FROM emergency_reports WHERE reporter_id = ? ORDER BY time DESC`,
            [reporterId]
        );
        return rows;
    }

    // Get one report
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM emergency_reports WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    // Update editable fields of a report (used when a resident edits their own report)
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
                report.peopleAffected || 0,
                report.specialNeeds || null,
                report.photoUrl || null,
                report.mediaType || null,
                id
            ]
        );
        return result.affectedRows;
    }

    // Update report status
    static async updateStatus(id, status) {
        const [result] = await db.query(
            `UPDATE emergency_reports SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows;
    }

    // Delete a report
    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM emergency_reports WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    // Assign responder/admin
    static async assign(id, assignedTo) {
        const [result] = await db.query(
            `UPDATE emergency_reports SET assigned_to = ?, assigned_at = NOW() WHERE id = ?`,
            [assignedTo, id]
        );
        return result.affectedRows;
    }

    // Dashboard statistics
    static async getStatistics() {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalReports,
                SUM(status='Received') AS pending,
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
