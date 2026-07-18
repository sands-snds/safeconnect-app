const db = require("../config/db");

class SystemSetting {
    static async getAll() {
        const [rows] = await db.query(`
            SELECT *
            FROM system_settings
            ORDER BY setting_key
        `);
        return rows;
    }

    static async get(key) {
        const [rows] = await db.query(
            `
            SELECT setting_value
            FROM system_settings
            WHERE setting_key=?
            `,
            [key]
        );
        return rows[0];
    }

    static async update(key, value) {
        const [result] = await db.query(

            `
            UPDATE system_settings
            SET setting_value=?
            WHERE setting_key=?
            `,
            [value, key]
        );
        return result.affectedRows;
    }
}

module.exports = SystemSetting;