const Log = require("../models/Log");
const AdminActivity = require("../models/AdminActivity");
const adminPresence = require("../services/adminPresence");
const LogArchive = require("../services/logArchiveService");

// ?archived=1 lists the archived entries instead of the current ones.
const wantsArchived = (req) => req.query.archived === "1" || req.query.archived === "true";

exports.getSigninLogs = async (req, res) => {
    try {
        const logs = await Log.getSigninLogs({ archived: wantsArchived(req) });
        return res.json(logs);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve sign-in logs."
        });
    }
};

// { admins: one row per admin account with online state + latest activity,
//   activity: the most recent admin actions, newest first }
exports.getAdminLogs = async (req, res) => {
    try {
        const [summaries, activity] = await Promise.all([
            AdminActivity.getAdminSummaries(),
            AdminActivity.getRecent(wantsArchived(req) ? 2000 : 500, { archived: wantsArchived(req) })
        ]);

        const admins = summaries.map((a) => ({
            ...a,
            // A logout as the latest action means they've left, even if they
            // were seen moments ago.
            online: a.latest_action !== "Logged out" && adminPresence.isOnline(a.id),
            last_seen: adminPresence.getLastSeen(a.id)
        }));

        return res.json({ success: true, admins, activity });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin logs."
        });
    }
};

// GET /logs/archive-settings/:log  (log = signin | admin) -> { days }
exports.getArchiveSettings = async (req, res) => {
    if (!LogArchive.LOGS[req.params.log]) {
        return res.status(404).json({ success: false, message: "Unknown log." });
    }
    try {
        const days = await LogArchive.getAutoArchiveDays(req.params.log);
        res.json({ success: true, days });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load archive settings." });
    }
};

// PUT /logs/archive-settings/:log  body { days: 0 | 30 | 90 | 180 | 365 }
exports.updateArchiveSettings = async (req, res) => {
    const days = Number(req.body.days);
    if (!LogArchive.LOGS[req.params.log]) {
        return res.status(404).json({ success: false, message: "Unknown log." });
    }
    if (!LogArchive.ALLOWED_DAYS.includes(days)) {
        return res.status(400).json({ success: false, message: "Choose Off, 30 days, 90 days, 6 months or 1 year." });
    }
    try {
        await LogArchive.setAutoArchiveDays(req.params.log, days);
        // Apply the new period right away instead of waiting for the next run.
        const archived = await LogArchive.runAutoArchive(req.params.log);
        res.json({ success: true, days, archived });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update archive settings." });
    }
};

exports.logAdminLogout = async (req, res) => {
    try {
        await AdminActivity.record(req.admin, "Logged out");
        adminPresence.clear(req.admin.id);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};
