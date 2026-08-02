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
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                suspect_info = ?
            WHERE id = ?
            `,
            [
                report.crimeType,
                report.location,
                report.latitude || null,
                report.longitude || null,
                report.description,
                report.suspectInfo || null,
                id
            ]
        );
        return result.affectedRows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            `UPDATE petty_crimes SET status = ? WHERE id = ?`,
            [status, id]
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
