const Log = require("../models/Log");
const AdminActivity = require("../models/AdminActivity");
const adminPresence = require("../services/adminPresence");
const LogArchive = require("../services/logArchiveService");

const wantsArchived = (req) => req.query.archived === "1" || req.query.archived === "true";

const ResidentActivity = require("../models/ResidentActivity");

const withActivity = async (logs) => {
    const successes = logs.filter((l) => l.status === "Success");
    if (!successes.length) return logs.map((l) => ({ ...l, activity: [] }));

    const emails = [...new Set(successes.map((l) => l.email_address))];
    const since = successes.reduce((min, l) => (new Date(l.timestamp) < min ? new Date(l.timestamp) : min), new Date());
    const events = await ResidentActivity.forEmailsSince(emails, since);

    const starts = {};
    for (const l of successes) (starts[l.email_address] ||= []).push(new Date(l.timestamp).getTime());
    for (const list of Object.values(starts)) list.sort((a, b) => a - b);

    return logs.map((l) => {
        if (l.status !== "Success") return { ...l, activity: [] };
        const start = new Date(l.timestamp).getTime();
        const end = starts[l.email_address].find((t) => t > start) ?? Infinity;
        const activity = events
            .filter((e) => e.email_address === l.email_address)
            .filter((e) => { const t = new Date(e.created_at).getTime(); return t >= start && t < end; })
            .map(({ action, details, created_at }) => ({ action, details, created_at }));
        return { ...l, activity };
    });
};

exports.getSigninLogs = async (req, res) => {
    try {
        const logs = await Log.getSigninLogs({ archived: wantsArchived(req), residentsOnly: true });
        return res.json(await withActivity(logs));
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve sign-in logs."
        });
    }
};

exports.getAdminLogs = async (req, res) => {
    try {
        const [summaries, activity] = await Promise.all([
            AdminActivity.getAdminSummaries(),
            AdminActivity.getRecent(wantsArchived(req) ? 2000 : 500, { archived: wantsArchived(req) })
        ]);

        const admins = summaries.map((a) => ({
            ...a,

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
