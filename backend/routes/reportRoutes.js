// Cross-resource report routes. Type-specific CRUD lives in
// emergencyReportRoutes.js, assistanceRequestRoutes.js, and
// pettyCrimeRoutes.js — this file handles the aggregate "my reports" view
// used by MyReportsPage.jsx and archiving, which works the same for all three.
const express = require("express");
const router = express.Router();
const db = require("../config/db");

const myReportsController = require("../controllers/myReportsController");
const archiveController = require("../controllers/archiveController");
const { REPORT_TABLES } = require("../services/archiveService");
const { verifyToken, verifyAdmin, verifySuperAdmin, verifySelfOrAnyAdmin } = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");

// e.g. "Emergency report ER-2026-0001"
const describeReport = async (req) => {
    const config = REPORT_TABLES[req.params.type];
    if (!config) return null;
    let ref = `#${req.params.id}`;
    try {
        const [[row]] = await db.query(
            `SELECT report_reference FROM ${config.table} WHERE id = ?`,
            [req.params.id]
        );
        if (row?.report_reference) ref = row.report_reference;
    } catch {
        // fall back to the numeric id
    }
    return `${config.label} ${ref}`;
};

const describeArchiveSetting = (req) => {
    const months = Number(req.body.months);
    return months ? `Auto-archive after ${months === 12 ? "1 year" : `${months} months`}` : "Auto-archive turned off";
};

router.get("/user/:userId", verifyToken, verifySelfOrAnyAdmin, myReportsController.getMyReports);

router.get("/archive-settings", verifyToken, verifyAdmin, archiveController.getSettings);
router.put("/archive-settings", verifyToken, verifyAdmin, verifySuperAdmin,
    logActivity("Changed archive settings", describeArchiveSetting), archiveController.updateSettings);

// :type is emergency | assistance | pettyCrime
router.patch("/:type/:id/archive", verifyToken, verifyAdmin,
    logActivity("Archived report", describeReport), archiveController.archiveReport);
router.patch("/:type/:id/restore", verifyToken, verifyAdmin,
    logActivity("Restored archived report", describeReport), archiveController.restoreReport);

module.exports = router;
