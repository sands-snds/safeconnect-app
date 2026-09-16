const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");

const reportController = require("../controllers/reportController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ── Multer setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|mov|avi|webm)/;
    allowed.test(file.mimetype) ? cb(null, true) : cb(new Error("Only images and videos are allowed."), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Routes ────────────────────────────────────────────────────────────────────
router.post("/",             verifyToken,             upload.array("media", 10), reportController.createReport);
router.get("/",              verifyToken, verifyAdmin, reportController.getReports);
router.get("/statistics",    verifyToken, verifyAdmin, reportController.getStatistics);
router.get("/:id",           verifyToken,             reportController.getReport);
router.put("/:id",           verifyToken,             reportController.updateReport);
router.put("/:id/status",    verifyToken, verifyAdmin, reportController.updateStatus);
router.patch("/:id/status",  verifyToken, verifyAdmin, reportController.updateStatus);
router.delete("/:id",        verifyToken,             reportController.deleteReport);

module.exports = router;