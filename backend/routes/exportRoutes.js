const express = require("express");

const router = express.Router();

const exportController = require("../controllers/exportController");

const {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin
} = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");

router.use(verifyToken);
router.use(verifyAdmin);


const SYSTEM_EXPORTS = ["users", "signinLogs", "adminLogs"];
router.use("/:format/:type", (req, res, next) =>
    SYSTEM_EXPORTS.includes(req.params.type) ? verifySuperAdmin(req, res, next) : next()
);

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