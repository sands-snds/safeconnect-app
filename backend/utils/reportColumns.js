const db = require("../config/db");

// Report lists leave out photo_url (the base64 photo or video, often several
// MB per report) and say only whether there is one (has_media). The media is
// loaded on its own when someone opens a report's details (GET /:id).
//
// The column list is read from the table, so columns added later are
// included without changing this file. It is kept for a minute, because the
// startup schema updates can add columns after the first requests.
const CACHE_MS = 60 * 1000;
const cache = new Map();

async function listColumns(table) {
    const cached = cache.get(table);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.sql;

    const [rows] = await db.query(
        `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME <> 'photo_url'
         ORDER BY ORDINAL_POSITION`,
        [table]
    );
    const sql = [
        ...rows.map((r) => `\`${r.name}\``),
        "(photo_url IS NOT NULL AND photo_url <> '') AS has_media"
    ].join(", ");
    cache.set(table, { at: Date.now(), sql });
    return sql;
}

module.exports = { listColumns };
