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

// The Facebook page card pinned above the announcements: anyone can read it;
// Officials and Admins switch it on / off and change its picture (no delete).
const FacebookCard = require("../services/facebookCardService");
router.get("/facebook-card", async (req, res) => {
    try { res.json({ success: true, card: await FacebookCard.get() }); }
    catch (err) { console.error(err); res.status(500).json({ success: false, message: "Couldn't load the Facebook card." }); }
});
router.put("/facebook-card", verifyToken, verifyAdmin, announcementsChanged,
    logActivity("Changed Facebook card", (req) => (req.body?.enabled ? "Facebook page card: shown" : "Facebook page card: hidden")),
    async (req, res) => {
        if (typeof req.body?.enabled !== "boolean") return res.status(400).json({ success: false, message: "Say whether the card is on or off." });
        try { res.json({ success: true, card: await FacebookCard.setEnabled(req.body.enabled) }); }
        catch (err) { console.error(err); res.status(500).json({ success: false, message: "Couldn't save the Facebook card." }); }
    });
router.post("/facebook-card/image", verifyToken, verifyAdmin, announcementsChanged, upload.single("image"),
    logActivity("Changed Facebook card", () => "Facebook page card: new picture"),
    async (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, message: "Choose a JPEG, PNG or WEBP picture." });
        try { res.json({ success: true, card: await FacebookCard.setImage(`/uploads/${req.file.filename}`) }); }
        catch (err) { console.error(err); res.status(500).json({ success: false, message: "Couldn't save the picture." }); }
    });

const ARCHIVE_PERIOD_NAMES = { 7: "7 days", 90: "3 months", 180: "6 months", 365: "1 year" };
const describeArchiveSetting = (req) => {
    const days = Number(req.body?.days);
    return days ? `Announcements: auto-archive after ${ARCHIVE_PERIOD_NAMES[days] || `${days} days`}` : "Announcements: auto-archive turned off";
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
