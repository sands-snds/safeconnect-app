const express = require("express");

const router = express.Router();

const reportController = require("../controllers/reportController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.post("/", verifyToken, reportController.createReport);

router.get("/", verifyToken, verifyAdmin, reportController.getReports);

router.get("/statistics", verifyToken, verifyAdmin, reportController.getStatistics);

router.get("/:id", verifyToken, reportController.getReport);

router.put("/:id/status", verifyToken, verifyAdmin, reportController.updateStatus);

module.exports = router;