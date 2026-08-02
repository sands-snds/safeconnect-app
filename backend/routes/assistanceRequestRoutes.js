const express = require("express");
const router = express.Router();

const controller = require("../controllers/assistanceRequestController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, controller.createRequest);
router.get("/", verifyToken, verifyAdmin, controller.getRequests);
router.get("/statistics", verifyToken, verifyAdmin, controller.getStatistics);
router.get("/:id", verifyToken, controller.getRequest);
router.put("/:id", verifyToken, controller.updateRequest);
router.put("/:id/status", verifyToken, verifyAdmin, controller.updateStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, controller.updateStatus);
router.delete("/:id", verifyToken, verifyAdmin, controller.deleteRequest);

module.exports = router;
