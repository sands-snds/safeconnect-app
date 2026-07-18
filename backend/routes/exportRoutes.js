const express = require("express");

const router = express.Router();

const exportController = require("../controllers/exportController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(verifyAdmin);

router.get(
    "/pdf/reports",
    exportController.exportReportsPDF
);

//router.get(
//    "/excel/reports",
//    verifyToken,
//    verifyAdmin,
//    exportController.exportReportsExcel
//);

module.exports = router;