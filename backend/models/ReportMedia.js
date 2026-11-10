const db = require("../config/db");

// The media check's findings for one report (utils/mediaCheck.js →
// mediaColumns), in any of the three report tables.
const TABLES = ["emergency_reports", "assistance_requests", "petty_crimes"];

class ReportMedia {
    static async save(table, id, { mediaTakenAt, mediaLatitude, mediaLongitude, mediaFlags }) {
        if (!TABLES.includes(table)) throw new Error(`Unknown report table: ${table}`);
        await db.query(
            `UPDATE ${table}
             SET media_taken_at = ?, media_latitude = ?, media_longitude = ?, media_flags = ?
             WHERE id = ?`,
            [mediaTakenAt || null, mediaLatitude ?? null, mediaLongitude ?? null, mediaFlags || null, id]
        );
    }
}

module.exports = ReportMedia;
