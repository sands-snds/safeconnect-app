const crypto = require("crypto");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const { ROLES, MAIN_ACCOUNT_EMAIL } = require("../utils/roles");








async function ensureMainAccount() {
    const [[existing]] = await db.query(
        `SELECT id, role, status FROM registered_users WHERE LOWER(email_address) = ?`,
        [MAIN_ACCOUNT_EMAIL]
    );

    if (existing) {
        if (existing.role !== ROLES.SUPER_ADMIN || existing.status !== "Active") {
            await db.query(
                `UPDATE registered_users SET role = ?, status = 'Active' WHERE id = ?`,
                [ROLES.SUPER_ADMIN, existing.id]
            );
            console.log("Main barangay account restored to an Active Admin.");
        }
        return;
    }

    const [[usernameTaken]] = await db.query(
        `SELECT id FROM registered_users WHERE username = 'brgystafe'`
    );
    const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

    await db.query(
        `INSERT INTO registered_users
         (full_name, username, email_address, password, role, status)
         VALUES (?, ?, ?, ?, ?, 'Active')`,
        ["Barangay Sta. Fe", usernameTaken ? null : "brgystafe", MAIN_ACCOUNT_EMAIL, unusablePassword, ROLES.SUPER_ADMIN]
    );
    console.log(`Created the main barangay account (${MAIN_ACCOUNT_EMAIL}). Use "Forgot password?" to set its password.`);
}

module.exports = { ensureMainAccount };
