const db = require("../config/db");
const live = require("../services/liveUpdates");
const { REPORT_TABLES } = require("../services/archiveService");

const TABLES = new Set(Object.values(REPORT_TABLES).map((c) => c.table));

// After a report is added, edited, deleted, archived or restored: the staff
// pages and the reporter's own pages (on every device they're signed in on)
// reload their lists. The event carries no report data; each page fetches
// again through its usual, permission-checked endpoint.
//
// table: the report table, or a function of req (archive routes take :type).
// The reporter is looked up before the change, so a deleted report still
// reaches them. A new report's reporter is the signed-in user.
const reportsChanged = (table) => async (req, res, next) => {
    const name = typeof table === "function" ? table(req) : table;
    let reporterId = null;
    if (req.params.id && TABLES.has(name)) {
        try {
            const [[row]] = await db.query(`SELECT reporter_id FROM ${name} WHERE id = ?`, [req.params.id]);
            reporterId = row?.reporter_id || null;
        } catch {
            // the update still goes through; only the reporter's refresh is skipped
        }
    } else if (!req.params.id && req.user) {
        reporterId = req.user.id;
    }

    res.on("finish", () => {
        if (res.statusCode >= 400) return;
        try {
            live.notifyAdmins("reports");
            if (reporterId) live.notifyUser(reporterId, "reports");
        } catch (err) {
            console.error("Live update failed:", err.message);
        }
    });
    next();
};

const tableOfType = (req) => REPORT_TABLES[req.params.type]?.table;

module.exports = { reportsChanged, tableOfType };
