const db = require("../config/db");
const AdminActivity = require("../models/AdminActivity");

// Route-level admin activity logging. Put after verifyAdmin:
//
//   router.patch("/:id/status", verifyToken, verifyAdmin,
//       logActivity("Updated user status", describeFn), controller.updateStatus);
//
// describe(req) may be async and returns the details text. It runs BEFORE
// the controller (so e.g. a deleted announcement's title can still be read),
// but the entry is only written once the response is sent, and only if the
// request succeeded (2xx/3xx and the JSON body didn't say success: false).
const logActivity = (action, describe) => async (req, res, next) => {
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

    res.on("finish", () => {
        if (!req.admin || res.statusCode >= 400 || body?.success === false) return;

        AdminActivity.record(req.admin, action, details).catch((err) =>
            console.error("Admin activity log failed:", err)
        );
    });

    next();
};

// Reads the report reference (e.g. "ER-2026-0001") for nicer log details.
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
    return `${label} ${ref} → ${req.body.status}`;
};

module.exports = {
    logActivity,
    describeStatusChange
};
