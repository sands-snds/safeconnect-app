const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");

const controller = require("../controllers/pettyCrimeController");
const { verifyToken, verifyAdmin, verifyReportAccess } = require("../middleware/authMiddleware");
const { logActivity, describeStatusChange } = require("../middleware/activityLogger");

const logStatus = logActivity("Updated report status", describeStatusChange("petty_crimes", "Petty crime report"));

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
router.post("/",             verifyToken,             upload.array("media", 10), controller.createReport);
router.get("/",              verifyToken, verifyAdmin, controller.getReports);
router.get("/statistics",    verifyToken, verifyAdmin, controller.getStatistics);
router.get("/:id",           verifyToken, verifyReportAccess("petty_crimes", "admin"), controller.getReport);
router.put("/:id",           verifyToken, verifyReportAccess("petty_crimes", "super"), controller.updateReport);
router.patch("/:id/status",  verifyToken, verifyAdmin, logStatus, controller.updateStatus);
router.delete("/:id",        verifyToken, verifyReportAccess("petty_crimes", "super"), controller.deleteReport);

module.exports = router;