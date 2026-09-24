const express = require("express");

const router = express.Router();

const exportController = require("../controllers/exportController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(verifyAdmin);

// :type is one of: emergency, assistance, pettyCrime, users, signinLogs, adminLogs
// (see ExportService.validTypes in exportService.js for the source of truth)
router.get(
    "/pdf/:type",
    exportController.exportPDF
);

router.get(
    "/excel/:type",
    exportController.exportExcel
);

module.exports = router;