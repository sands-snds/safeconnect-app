const Log = require("../models/Log");
const AdminActivity = require("../models/AdminActivity");
const adminPresence = require("../services/adminPresence");

exports.getSigninLogs = async (req, res) => {
    try {
        const logs = await Log.getSigninLogs();
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
            AdminActivity.getRecent()
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
