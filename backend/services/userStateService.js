const db = require("../config/db");

// Per-account state that used to live only in one browser, so it now
// follows the person to every device they sign in on:
//   read items  - what they've marked as read or dismissed, as keys:
//                 "announcement:<id>"  an announcement in the bell
//                 "weather:<YYYY-MM-DD>" that day's rain advisory
//                 "admin-demo:hidden"  "Don't show the admin demo again"
//                 "notif-archived:<id>" an announcement archived from the bell
//                 "notif-deleted:<id>"  an announcement deleted from the bell
//   preferences - { language: "en" | "tl" }

const ITEM_KEY_REGEX = /^[a-z-]{1,30}:[A-Za-z0-9._-]{1,60}$/;
const LANGUAGES = ["en", "tl"];
const MAX_KEYS_PER_REQUEST = 500;

async function ensureSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS user_read_items (
            user_id INT NOT NULL,
            item_key VARCHAR(100) NOT NULL,
            read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, item_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INT NOT NULL,
            language VARCHAR(5) DEFAULT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
}

async function getState(userId) {
    const [items] = await db.query(
        `SELECT item_key FROM user_read_items WHERE user_id = ?`,
        [userId]
    );
    const [[prefs]] = await db.query(
        `SELECT language FROM user_preferences WHERE user_id = ?`,
        [userId]
    );
    return {
        readItems: items.map((r) => r.item_key),
        preferences: { language: prefs?.language || null }
    };
}

// Returns the cleaned keys, or null if the request is invalid.
function cleanKeys(keys) {
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > MAX_KEYS_PER_REQUEST) return null;
    const unique = [...new Set(keys.map((k) => String(k)))];
    return unique.every((k) => ITEM_KEY_REGEX.test(k)) ? unique : null;
}

async function markRead(userId, keys) {
    await db.query(
        `INSERT IGNORE INTO user_read_items (user_id, item_key) VALUES ?`,
        [keys.map((k) => [userId, k])]
    );
}

// Only archived announcements can be "un-marked" (restored to the inbox).
const RESTORABLE_PREFIX = "notif-archived:";

async function unmark(userId, keys) {
    const restorable = keys.filter((k) => k.startsWith(RESTORABLE_PREFIX));
    if (!restorable.length) return;
    await db.query(
        `DELETE FROM user_read_items WHERE user_id = ? AND item_key IN (?)`,
        [userId, restorable]
    );
}

async function setLanguage(userId, language) {
    await db.query(
        `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE language = VALUES(language)`,
        [userId, language]
    );
}

module.exports = { LANGUAGES, ensureSchema, getState, cleanKeys, markRead, unmark, setLanguage };
