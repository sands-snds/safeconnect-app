const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

const {
    verifyToken,
    verifyAdmin,
    verifySelfOrAdmin
} = require("../middleware/authMiddleware");

// Admin-only: full user list / status management
router.get("/", verifyToken, verifyAdmin, userController.getUsers);
router.put("/:id", verifyToken, verifyAdmin, userController.updateUserStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, userController.updateUserStatus);

// Self-or-admin: a resident's own profile (SettingsPage.jsx, MyReportsPage.jsx)
router.get("/:id", verifyToken, verifySelfOrAdmin, userController.getUserById);
router.post("/:id/photo", verifyToken, verifySelfOrAdmin, upload.single("photo"), userController.uploadPhoto);
router.patch("/:id/username", verifyToken, verifySelfOrAdmin, userController.updateUsername);
router.patch("/:id/password", verifyToken, verifySelfOrAdmin, userController.changePassword);

module.exports = router;
