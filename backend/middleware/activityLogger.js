const db = require("../config/db");
const AdminActivity = require("../models/AdminActivity");

const logActivity = (action, describe) => async (req, res, next) => {
    let details = null;
    try {
        details = describe ? await describe(req) : null;
    } catch {
    }

    let body;
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        body = data;
        return originalJson(data);
    };

    res.on("finish", () => {
        if (!req.admin || res.statusCode >= 400 || body?.success === false) return;

        AdminActivity.record(req.admin, action, details).catch((err) =>
            console.error("Admin activity log failed:", err)
        );
    });

    next();
};

const describeStatusChange = (table, label) => async (req) => {
    let ref = `#${req.params.id}`;
    try {
        const [[row]] = await db.query(
            `SELECT report_reference FROM ${table} WHERE id = ?`,
            [req.params.id]
        );
        if (row?.report_reference) ref = row.report_reference;
    } catch {
        // fall back to the numeric id
    }
    const reason = req.body.status === "Dismissed" && typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    return `${label} ${ref} → ${req.body.status}${reason ? ` (reason: ${reason.slice(0, 200)})` : ""}`;
};

module.exports = {
    logActivity,
    describeStatusChange
};
