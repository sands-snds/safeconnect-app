const db = require("../config/db");
const ResidentActivity = require("../models/ResidentActivity");

const logResidentActivity = (action, describe) => async (req, res, next) => {
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

const reportReference = (table) => async (req) => {
    const [[row]] = await db.query(`SELECT report_reference FROM ${table} WHERE id = ?`, [req.params.id]);
    return row?.report_reference || `#${req.params.id}`;
};

module.exports = { logResidentActivity, reportReference };
