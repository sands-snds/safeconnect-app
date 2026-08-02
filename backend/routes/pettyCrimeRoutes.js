const express = require("express");
const router = express.Router();

const controller = require("../controllers/pettyCrimeController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, controller.createReport);
router.get("/", verifyToken, verifyAdmin, controller.getReports);
router.get("/statistics", verifyToken, verifyAdmin, controller.getStatistics);
router.get("/:id", verifyToken, controller.getReport);
router.put("/:id", verifyToken, controller.updateReport);
router.patch("/:id/status", verifyToken, verifyAdmin, controller.updateStatus);
router.delete("/:id", verifyToken, verifyAdmin, controller.deleteReport);

module.exports = router;
