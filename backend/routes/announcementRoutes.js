const express = require("express");

const router = express.Router();

const controller = require("../controllers/announcementController");
const upload = require("../middleware/uploadMiddleware");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");
const Announcement = require("../models/Announcement");

const announcementTitle = async (req) => {
    if (req.body?.title) return `"${req.body.title}"`;
    const existing = await Announcement.findById(req.params.id);
    return existing?.title ? `"${existing.title}"` : `Announcement #${req.params.id}`;
};

// Public: residents and the landing page read announcements without logging in.
router.get("/", controller.getAnnouncements);

// Admin-only: creating/editing announcements, including the "paste a link" preview.
router.get("/link-preview", verifyToken, verifyAdmin, controller.getLinkPreview);
router.post("/", verifyToken, verifyAdmin, upload.single("image"), logActivity("Created announcement", announcementTitle), controller.createAnnouncement);
router.put("/:id", verifyToken, verifyAdmin, upload.single("image"), logActivity("Edited announcement", announcementTitle), controller.updateAnnouncement);
router.delete("/:id", verifyToken, verifyAdmin, logActivity("Deleted announcement", announcementTitle), controller.deleteAnnouncement);

module.exports = router;
