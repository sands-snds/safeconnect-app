const db = require("../config/db");
const ResidentActivity = require("../models/ResidentActivity");

// Route-level logging of what residents do, for Resident Sign-in Logs. Put
// after verifyToken:
//
//   router.delete("/:id", verifyToken, ...,
//       logResidentActivity("Deleted emergency report", reportReference("emergency_reports")),
//       controller.deleteReport);
//
// Like middleware/activityLogger.js: describe(req) runs BEFORE the
// controller (so a deleted report's reference can still be read), and the
// entry is written only after a successful response, and only when the
// signed-in account is a resident (Officials and Admins have Admin Logs).
// A new report's reference comes from the response (reportReference).
const logResidentActivity = (action, describe) => async (req, res, next) => {
    let details = null;
    try {
        details = describe ? await describe(req) : null;
    } catch {
        // details are best-effort; still log the action itself
    }

    let body;
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        body = data;
        return originalJson(data);
    };

    res.on("finish", async () => {
        if (!req.user || res.statusCode >= 400 || body?.success === false) return;
        try {
            const [[user]] = await db.query(
                `SELECT email_address, role FROM registered_users WHERE id = ?`,
                [req.user.id]
            );
            if (!user || user.role !== "resident") return;
            await ResidentActivity.record(req.user.id, user.email_address, action, details || body?.reportReference || null);
        } catch (err) {
            console.error("Resident activity log failed:", err.message);
        }
    });

    next();
};

// details: the report's reference (e.g. "SC-2026-000021").
const reportReference = (table) => async (req) => {
    const [[row]] = await db.query(`SELECT report_reference FROM ${table} WHERE id = ?`, [req.params.id]);
    return row?.report_reference || `#${req.params.id}`;
};

module.exports = { logResidentActivity, reportReference };
