const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");

const controller = require("../controllers/assistanceRequestController");
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
router.post("/",             verifyToken,             upload.array("media", 10), controller.createRequest);
router.get("/",              verifyToken, verifyAdmin, controller.getRequests);
router.get("/statistics",    verifyToken, verifyAdmin, controller.getStatistics);
router.get("/:id",           verifyToken,             controller.getRequest);
router.put("/:id",           verifyToken,             controller.updateRequest);
router.put("/:id/status",    verifyToken, verifyAdmin, controller.updateStatus);
router.patch("/:id/status",  verifyToken, verifyAdmin, controller.updateStatus);
router.delete("/:id",        verifyToken, verifyAdmin, controller.deleteRequest);

module.exports = router;