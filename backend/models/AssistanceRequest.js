// Assistance Requests model (table: assistance_requests).
// Field names map to what ResidentAssistanceModal.jsx sends via
// createAssistanceRequest()/updateAssistanceRequest() in Services/api.js.
const db = require("../config/db");

class AssistanceRequest {

    static async create(request) {
        const [result] = await db.query(
            `
            INSERT INTO assistance_requests
            (
                report_reference,
                reporter_id,
                request_assistance_type,
                full_name,
                contact_number,
                email_address,
                current_location,
                latitude,
                longitude,
                urgency_level,
                describe_your_situation,
                special_needs,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                request.reportReference,
                request.reporterId || null,
                request.assistanceType,
                request.fullName,
                request.contactNumber,
                request.email || null,
                request.location,
                request.latitude || null,
                request.longitude || null,
                request.urgency,
                request.situation,
                request.specialNeeds || null,
                "Pending"
            ]
        );
        return result.insertId;
    }

    static async findAll(filters = {}) {
        let sql = `SELECT * FROM assistance_requests WHERE 1=1`;
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
            `SELECT * FROM assistance_requests WHERE reporter_id = ? ORDER BY timestamp DESC`,
            [reporterId]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT * FROM assistance_requests WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async update(id, request) {
        const [result] = await db.query(
            `
            UPDATE assistance_requests
            SET
                request_assistance_type = ?,
                current_location = ?,
                latitude = ?,
                longitude = ?,
                urgency_level = ?,
                describe_your_situation = ?,
                special_needs = ?
            WHERE id = ?
            `,
            [
                request.assistanceType,
                request.location,
                request.latitude || null,
                request.longitude || null,
                request.urgency,
                request.situation,
                request.specialNeeds || null,
                id
            ]
        );
        return result.affectedRows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            `UPDATE assistance_requests SET status = ? WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query(
            `DELETE FROM assistance_requests WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    static async getStatistics() {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalRequests,
                SUM(status='Pending') AS pending,
                SUM(status='In Progress') AS inProgress,
                SUM(status='Resolved') AS resolved,
                SUM(status='Cancelled') AS cancelled
            FROM assistance_requests
        `);
        return rows[0];
    }

    static async getLatestReference() {
        const [rows] = await db.query(`
            SELECT report_reference
            FROM assistance_requests
            WHERE report_reference IS NOT NULL
            ORDER BY id DESC
            LIMIT 1
        `);
        return rows[0];
    }
}

module.exports = AssistanceRequest;
