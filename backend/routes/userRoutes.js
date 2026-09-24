const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

const {
    verifyToken,
    verifyAdmin,
    verifySelfOrAdmin
} = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");
const User = require("../models/User");

const describeUserChange = (field) => async (req) => {
    const user = await User.findById(req.params.id);
    const who = user ? (user.email_address || user.username) : `User #${req.params.id}`;
    return `${who} → ${req.body[field]}`;
};
const logUserStatus = logActivity("Changed user status", describeUserChange("status"));

// Admin-only: full user list / status + role management
router.get("/", verifyToken, verifyAdmin, userController.getUsers);
router.put("/:id", verifyToken, verifyAdmin, logUserStatus, userController.updateUserStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, logUserStatus, userController.updateUserStatus);
router.patch("/:id/role", verifyToken, verifyAdmin, logActivity("Changed user role", describeUserChange("role")), userController.updateUserRole);

// Self-or-admin: a resident's own profile (SettingsPage.jsx, MyReportsPage.jsx)
router.get("/:id", verifyToken, verifySelfOrAdmin, userController.getUserById);
router.post("/:id/photo", verifyToken, verifySelfOrAdmin, upload.single("photo"), userController.uploadPhoto);
router.patch("/:id/username", verifyToken, verifySelfOrAdmin, userController.updateUsername);
router.patch("/:id/password", verifyToken, verifySelfOrAdmin, userController.changePassword);

module.exports = router;
