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
                number_of_people_needing_help,
                urgency_level,
                describe_your_situation,
                special_needs,
                victim_of_emergency,
                photo_url,
                media_type,
                report_for,
                victim_name,
                victim_contact,
                victim_relationship,
                victim_details,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                request.peopleAffected || 1,
                request.urgency || "",
                request.situation,
                request.specialNeeds || null,
                request.victimOfEmergency || null,
                request.photoUrl || null,
                request.mediaType || null,
                request.reportFor || "self",
                request.victimName || null,
                request.victimContact || null,
                request.victimRelationship || null,
                request.victimDetails || null,
                "Received"
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

    static async findStatusById(id) {
        const [rows] = await db.query(
            `SELECT id, status, reporter_id FROM assistance_requests WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async hasMedia(id) {
        const [rows] = await db.query(
            `SELECT photo_url IS NOT NULL AND photo_url <> '' AS has_media FROM assistance_requests WHERE id = ?`,
            [id]
        );
        return Boolean(rows[0]?.has_media);
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
                urgency_level = COALESCE(?, urgency_level),
                describe_your_situation = ?,
                special_needs = ?,
                victim_of_emergency = COALESCE(?, victim_of_emergency),
                photo_url = COALESCE(?, photo_url),
                media_type = COALESCE(?, media_type)
            WHERE id = ?
            `,
            [
                request.assistanceType,
                request.location,
                request.latitude || null,
                request.longitude || null,
                request.urgency || null,
                request.situation,
                request.specialNeeds || null,
                request.victimOfEmergency || null,
                request.photoUrl || null,
                request.mediaType || null,
                id
            ]
        );
        return result.affectedRows;
    }

    static async updateStatus(id, status, dismissalReason = null) {
        const [result] = await db.query(
            `UPDATE assistance_requests
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
