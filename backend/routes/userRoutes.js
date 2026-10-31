const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

const {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin,
    verifySelfOrAdmin
} = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");
const User = require("../models/User");
const { roleLabel } = require("../utils/roles");

const describeUserChange = (field) => async (req) => {
    const user = await User.findById(req.params.id);
    const who = user ? (user.email_address || user.username) : `User #${req.params.id}`;
    const value = field === "role" ? roleLabel(req.body.role) : req.body[field];
    return `${who} → ${value}`;
};
const logUserStatus = logActivity("Changed user status", describeUserChange("status"));
const describeUserTarget = async (req) => {
    const user = await User.findById(req.params.id);
    return user ? (user.email_address || user.username) : `User #${req.params.id}`;
};

router.get("/", verifyToken, verifyAdmin, verifySuperAdmin, userController.getUsers);
router.put("/:id", verifyToken, verifyAdmin, verifySuperAdmin, logUserStatus, userController.updateUserStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, verifySuperAdmin, logUserStatus, userController.updateUserStatus);
router.patch("/:id/role", verifyToken, verifyAdmin, verifySuperAdmin, logActivity("Changed user role", describeUserChange("role")), userController.updateUserRole);
// Closed accounts: Archived tab.
router.patch("/:id/archive", verifyToken, verifyAdmin, verifySuperAdmin, logActivity("Archived account", describeUserTarget), userController.archiveUser);
router.patch("/:id/restore", verifyToken, verifyAdmin, verifySuperAdmin, logActivity("Restored archived account", describeUserTarget), userController.restoreUser);

router.get("/:id", verifyToken, verifySelfOrAdmin, userController.getUserById);

const { afterSuccess, notifyUser } = require("../services/liveUpdates");
const profileChanged = afterSuccess((req) => notifyUser(req.params.id, "profile"));

router.post("/:id/photo", verifyToken, verifySelfOrAdmin, profileChanged, upload.single("photo"), userController.uploadPhoto);
router.patch("/:id/name", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateFullName);
router.patch("/:id/username", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateUsername);
router.patch("/:id/contact", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateContact);
router.patch("/:id/email", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateEmail);
router.patch("/:id/password", verifyToken, verifySelfOrAdmin, userController.changePassword);

module.exports = router;
