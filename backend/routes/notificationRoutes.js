const express = require("express");

const router = express.Router();

const controller = require("../controllers/notificationController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Resident-facing: a signed-in user's own notifications (status-change replies, etc).
router.get("/mine", verifyToken, controller.getMyNotifications);
router.put("/mine/read-all", verifyToken, controller.markAllMineAsRead);

// Admin-only: feeds the admin header notification bell.
router.get("/", verifyToken, verifyAdmin, controller.getNotifications);
router.put("/read-all", verifyToken, verifyAdmin, controller.markAllAsRead);
router.put("/:id/read", verifyToken, verifyAdmin, controller.markAsRead);

module.exports = router;
