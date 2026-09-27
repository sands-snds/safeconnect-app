const db = require("../config/db");

class Log {
    static async getSigninLogs() {
        const [rows] = await db.query(`
            -- role: the account's current role, looked up by email (NULL for
            -- failed attempts with an email that has no account).
            SELECT s.*, u.role
            FROM signin_logs s
            LEFT JOIN registered_users u ON u.email_address = s.email_address
            ORDER BY s.id DESC
        `);
        return rows;
    }

}
module.exports = Log;