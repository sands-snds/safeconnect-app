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
                location,
                incident_details,
                latitude,
                longitude,
                photo_url,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                report.reference,
                report.reporterId,
                report.emergencyType,
                report.location,
                report.details,
                report.latitude,
                report.longitude,
                report.photoUrl,
                "Pending"
            ]
        );
        return result.insertId;
    }

    // Get all reports
    static async findAll(filters = {}) {
        let sql = `
            SELECT
                er.*,
                ru.full_name AS reporter
            FROM emergency_reports er
            JOIN registered_users ru
                ON ru.id = er.reporter_id
            WHERE 1=1
        `;

        const values = [];
        if (filters.status) {
            sql += " AND er.status=?";
            values.push(filters.status);
        }

        if (filters.type) {
            sql += " AND er.emergency_type=?";
            values.push(filters.type);
        }

        if (filters.from) {
            sql += " AND DATE(er.created_at)>=?";
            values.push(filters.from);
        }

        if (filters.to) {
            sql += " AND DATE(er.created_at)<=?";
            values.push(filters.to);
        }

        sql += " ORDER BY er.created_at DESC";
        const [rows] = await db.query(sql, values);
        return rows;
    }

    // Get one report
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT
                er.*,
                ru.full_name,
                ru.contact_number,
                ru.email_address
            FROM emergency_reports er
            JOIN registered_users ru
                ON er.reporter_id = ru.id
            WHERE er.id = ?
        `, [id]);
        return rows[0];
    }

    // Update report status
    static async updateStatus(id, status) {
        const [result] = await db.query(
            `
            UPDATE emergency_reports
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );
        return result.affectedRows;
    }

    // Assign responder/admin
    static async assign(id, assignedTo) {
        const [result] = await db.query(
            `
            UPDATE emergency_reports
            SET
                assigned_to = ?,
                assigned_at = NOW()
            WHERE id = ?
            `,
            [assignedTo, id]
        );
        return result.affectedRows;
    }

    // Dashboard statistics
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
            ORDER BY id DESC
            LIMIT 1
        `);
        return rows[0];
    }
}

module.exports = Report;