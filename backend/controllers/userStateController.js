const db = require("../config/db");
const userState = require("../services/userStateService");
const live = require("../services/liveUpdates");

// GET /api/me/events -- live update stream (services/liveUpdates.js)
exports.events = async (req, res) => {
    try {
        const [[account]] = await db.query("SELECT role FROM registered_users WHERE id = ?", [req.user.id]);
        live.subscribe(req, res, { role: account?.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// GET /api/me/state
exports.getState = async (req, res) => {
    try {
        res.json({ success: true, ...(await userState.getState(req.user.id)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Could not load your saved settings." });
    }
};

// POST /api/me/read  { keys: ["announcement:12", ...] }
exports.markRead = async (req, res) => {
    const keys = userState.cleanKeys(req.body?.keys);
    if (!keys) return res.status(400).json({ success: false, message: "Invalid items." });
    try {
        await userState.markRead(req.user.id, keys);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Could not save that." });
    }
};

// POST /api/me/unread  { keys: ["notif-archived:12", ...] } -- restore archived announcements
exports.unmark = async (req, res) => {
    const keys = userState.cleanKeys(req.body?.keys);
    if (!keys) return res.status(400).json({ success: false, message: "Invalid items." });
    try {
        await userState.unmark(req.user.id, keys);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Could not save that." });
    }
};

// PUT /api/me/preferences  { language: "en" | "tl" }
exports.updatePreferences = async (req, res) => {
    const { language } = req.body || {};
    if (!userState.LANGUAGES.includes(language)) {
        return res.status(400).json({ success: false, message: "Unsupported language." });
    }
    try {
        await userState.setLanguage(req.user.id, language);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Could not save your language." });
    }
};
