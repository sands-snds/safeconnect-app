const express = require("express");

const router = express.Router();

const controller = require("../controllers/announcementController");
const upload = require("../middleware/uploadMiddleware");

const {
    verifyToken,
    attachUserIfPresent,
    verifyAdmin,
    verifySuperAdmin
} = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");
const Announcement = require("../models/Announcement");

const announcementTitle = async (req) => {
    if (req.body?.title) return `"${req.body.title}"`;
    const existing = await Announcement.findById(req.params.id);
    return existing?.title ? `"${existing.title}"` : `Announcement #${req.params.id}`;
};

const { afterSuccess, notifyAll } = require("../services/liveUpdates");
const announcementsChanged = afterSuccess(() => notifyAll("announcements"));

router.get("/", attachUserIfPresent, controller.getAnnouncements);

router.get("/link-preview", verifyToken, verifyAdmin, controller.getLinkPreview);

const describeArchiveSetting = (req) => {
    const months = Number(req.body?.months);
    return months ? `Announcements: auto-archive after ${months === 12 ? "1 year" : `${months} months`}` : "Announcements: auto-archive turned off";
};
router.get("/archive-settings", verifyToken, verifyAdmin, controller.getArchiveSettings);
router.put("/archive-settings", verifyToken, verifyAdmin, verifySuperAdmin, announcementsChanged,
    logActivity("Changed archive settings", describeArchiveSetting), controller.updateArchiveSettings);
router.patch("/:id/archive", verifyToken, verifyAdmin, announcementsChanged, logActivity("Archived announcement", announcementTitle), controller.archiveAnnouncement);
router.patch("/:id/restore", verifyToken, verifyAdmin, announcementsChanged, logActivity("Restored announcement", announcementTitle), controller.restoreAnnouncement);
router.post("/", verifyToken, verifyAdmin, announcementsChanged, upload.single("image"), logActivity("Created announcement", announcementTitle), controller.createAnnouncement);
router.put("/:id", verifyToken, verifyAdmin, announcementsChanged, upload.single("image"), logActivity("Edited announcement", announcementTitle), controller.updateAnnouncement);
router.delete("/:id", verifyToken, verifyAdmin, announcementsChanged, logActivity("Deleted announcement", announcementTitle), controller.deleteAnnouncement);

router.get("/:id/comments", controller.getComments);
router.post("/:id/like", verifyToken, controller.toggleLike);
router.post("/:id/comments", verifyToken, controller.createComment);
router.delete("/comments/:commentId", verifyToken, controller.deleteComment);

module.exports = router;
