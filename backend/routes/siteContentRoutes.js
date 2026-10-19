const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const controller = require("../controllers/siteContentController");
const { verifyToken, verifyAdmin, verifySuperAdmin } = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");

const adminOnly = [verifyToken, verifyAdmin, verifySuperAdmin];

// Carousel photos (images, 5 MB) and demo videos (MP4 / WebM, 100 MB).
// Bigger videos are better linked from YouTube: Azure ends requests that
// take longer than about 4 minutes, which a slow upload can.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const mediaUpload = multer({
    storage: multer.diskStorage({
        destination: path.join(__dirname, "..", "uploads"),
        filename: (req, file, cb) =>
            cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (IMAGE_TYPES.includes(file.mimetype) || VIDEO_TYPES.includes(file.mimetype)) return cb(null, true);
        cb(new Error("Only JPG, PNG or WebP photos and MP4 or WebM videos are allowed."));
    }
});

// Images over 5 MB are refused after upload (multer's limit is per route).
const checkImageSize = (req, res, next) => {
    if (req.file && IMAGE_TYPES.includes(req.file.mimetype) && req.file.size > 5 * 1024 * 1024) {
        require("fs").unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: "Photos must be 5 MB or smaller." });
    }
    next();
};

const handleUpload = (req, res, next) =>
    mediaUpload.single("file")(req, res, (err) => {
        if (!err) return next();
        const message = err.code === "LIMIT_FILE_SIZE" ? "Videos must be 100 MB or smaller. For longer videos, use a YouTube link." : err.message;
        res.status(400).json({ success: false, message });
    });

// Public: emergency contacts, footer officials and socials, plus the
// carousel photos and demo videos.
router.get("/", controller.getContent);

// Admin (super_admin) only: Content > Site Contacts.
router.put("/", ...adminOnly,
    logActivity("Updated site contacts", () => "Emergency contacts, officials and socials"),
    controller.updateContent);

// Admin (super_admin) only: Content > Site Contents.
router.put("/media", ...adminOnly,
    logActivity("Updated site contents", () => "Carousel photos and demo videos"),
    controller.updateMedia);
router.post("/upload", ...adminOnly, handleUpload, checkImageSize, controller.uploadMedia);

module.exports = router;
