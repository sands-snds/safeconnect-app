const express = require("express");

const router = express.Router();

const controller = require("../controllers/notificationController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const { afterSuccess, notifyUser, notifyAdmins } = require("../services/liveUpdates");

// Read, archived or deleted: the same person's other tabs and devices (or,
// for the shared staff inbox, the other staff) update their bells.
const mineChanged = afterSuccess((req) => notifyUser(req.user.id, "notifications"));
const staffInboxChanged = afterSuccess(() => notifyAdmins("admin-notification-state"));


router.get("/mine", verifyToken, controller.getMyNotifications);
router.put("/mine/read-all", verifyToken, mineChanged, controller.markAllMineAsRead);
router.put("/mine/archive", verifyToken, mineChanged, controller.archiveMine);
router.post("/mine/delete", verifyToken, mineChanged, controller.deleteMine);
router.put("/mine/:id/read", verifyToken, mineChanged, controller.markMineAsRead);

// Admin-only: feeds the admin header notification bell.
router.get("/", verifyToken, verifyAdmin, controller.getNotifications);
router.put("/read-all", verifyToken, verifyAdmin, staffInboxChanged, controller.markAllAsRead);
router.put("/read", verifyToken, verifyAdmin, staffInboxChanged, controller.markManyAsRead);
router.put("/archive", verifyToken, verifyAdmin, staffInboxChanged, controller.archiveNotifications);
router.put("/:id/read", verifyToken, verifyAdmin, staffInboxChanged, controller.markAsRead);

module.exports = router;
