// The server can't use the database at all (wrong DB_PASSWORD, server
// stopped, network or firewall), as opposed to a bug in one request.
const UNAVAILABLE_CODES = new Set([
    "ER_ACCESS_DENIED_ERROR",
    "ER_DBACCESS_DENIED_ERROR",
    "ER_BAD_DB_ERROR",
    "ER_CON_COUNT_ERROR",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "PROTOCOL_CONNECTION_LOST",
    "PROTOCOL_SEQUENCE_TIMEOUT",
]);

const isDatabaseUnavailable = (err) => Boolean(err && UNAVAILABLE_CODES.has(err.code));

const DATABASE_UNAVAILABLE_MESSAGE =
    "SafeConnect can't reach its database right now, so this can't be completed. Please try again in a few minutes. If it keeps happening, contact the Barangay Sta. Fe administrator.";

// For a route's catch block: 503 DATABASE_UNAVAILABLE when the database is
// unreachable (logged with its code so the cause is easy to find), else 500
// with `message`.
const sendServerError = (res, err, label, message) => {
    if (isDatabaseUnavailable(err)) {
        console.error(`${label}: database unavailable (${err.code}): ${err.message}`);
        return res.status(503).json({ success: false, code: "DATABASE_UNAVAILABLE", message: DATABASE_UNAVAILABLE_MESSAGE });
    }
    console.error(`${label}:`, err);
    return res.status(500).json({ success: false, message });
};

module.exports = { isDatabaseUnavailable, sendServerError, DATABASE_UNAVAILABLE_MESSAGE };
