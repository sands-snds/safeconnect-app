const express = require("express");

const router = express.Router();

const exportController = require("../controllers/exportController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");

router.use(verifyToken);
router.use(verifyAdmin);

const EXPORT_NAMES = {
    reportsOverTime: "Reports over time",
    statusSummary: "Reports by status",
    emergency: "Emergency reports",
    assistance: "Assistance requests",
    pettyCrime: "Petty crime reports",
    users: "Registered users",
    signinLogs: "Sign-in logs",
    adminLogs: "Admin activity"
};

const describeExport = (format) => (req) =>
    `${EXPORT_NAMES[req.params.type] || req.params.type} (${format})`;

// :type is one of: reportsOverTime, statusSummary, emergency, assistance, pettyCrime, users, signinLogs, adminLogs
// (see ExportService.validTypes in exportService.js for the source of truth)
router.get(
    "/pdf/:type",
    logActivity("Generated report", describeExport("PDF")),
    exportController.exportPDF
);

router.get(
    "/excel/:type",
    logActivity("Generated report", describeExport("Excel")),
    exportController.exportExcel
);

module.exports = router;