const db = require("../config/db");

class Log {
    static async getSigninLogs() {
        const [rows] = await db.query(`
            SELECT *
            FROM signin_logs
            ORDER BY id DESC
        `);
        return rows;
    }

    static async getAdminLogs() {

        const [rows] = await db.query(`
            SELECT *
            FROM admin_logs
            ORDER BY id DESC
        `);
        return rows;
    }

}
module.exports = Log;