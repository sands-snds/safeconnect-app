const express = require("express");

const router = express.Router();

const controller = require("../controllers/announcementController");
const upload = require("../middleware/uploadMiddleware");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

// Public: residents and the landing page read announcements without logging in.
router.get("/", controller.getAnnouncements);

// Admin-only: creating/editing announcements, including the "paste a link" preview.
router.get("/link-preview", verifyToken, verifyAdmin, controller.getLinkPreview);
router.post("/", verifyToken, verifyAdmin, upload.single("image"), controller.createAnnouncement);
router.put("/:id", verifyToken, verifyAdmin, upload.single("image"), controller.updateAnnouncement);
router.delete("/:id", verifyToken, verifyAdmin, controller.deleteAnnouncement);

module.exports = router;
