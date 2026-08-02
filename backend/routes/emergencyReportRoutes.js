const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, reportController.createReport);
router.get("/", verifyToken, verifyAdmin, reportController.getReports);
router.get("/statistics", verifyToken, verifyAdmin, reportController.getStatistics);
router.get("/:id", verifyToken, reportController.getReport);
router.put("/:id", verifyToken, reportController.updateReport);
router.put("/:id/status", verifyToken, verifyAdmin, reportController.updateStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, reportController.updateStatus);
router.delete("/:id", verifyToken, reportController.deleteReport);

module.exports = router;
