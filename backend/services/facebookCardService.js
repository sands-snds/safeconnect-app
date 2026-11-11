const db = require("../config/db");

// The barangay's Facebook page card, pinned above the announcements on the
// residents' News page. Officials and Admins can switch it on or off and change
// its picture; it can't be deleted. Stored as JSON in system_settings.
const SETTING_KEY = "facebook_page_card";
const PAGE_URL = "https://www.facebook.com/profile.php?id=100080219150790";

// imagePath: an uploaded picture ("/uploads/…"), or null for the built-in one
// (public/images/facebook-page.jpg).
const DEFAULTS = { enabled: true, imagePath: null, pageUrl: PAGE_URL };

const read = async () => {
    const [rows] = await db.query(`SELECT setting_value FROM system_settings WHERE setting_key = ?`, [SETTING_KEY]);
    let saved = {};
    try { saved = rows[0] ? JSON.parse(rows[0].setting_value) || {} : {}; } catch { saved = {}; }
    return {
        enabled: typeof saved.enabled === "boolean" ? saved.enabled : DEFAULTS.enabled,
        imagePath: typeof saved.imagePath === "string" && saved.imagePath.startsWith("/uploads/") ? saved.imagePath : null,
        pageUrl: PAGE_URL
    };
};

const write = async (card) => {
    const value = JSON.stringify({ enabled: card.enabled, imagePath: card.imagePath });
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [SETTING_KEY, value]
    );
    return read();
};

const get = read;
const setEnabled = async (enabled) => write({ ...(await read()), enabled: Boolean(enabled) });
const setImage = async (imagePath) => write({ ...(await read()), imagePath });

module.exports = { get, setEnabled, setImage, PAGE_URL };
