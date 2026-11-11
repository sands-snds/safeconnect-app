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
const { afterSuccess, notifyUser, notifyAdmins } = require("../services/liveUpdates");

// An account changed: the staff user lists and Account Verification reload,
// and the person's own open pages pick up their new details or status.
const accountChanged = afterSuccess((req) => { notifyAdmins("users"); notifyUser(req.params.id, "profile"); });

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

// Account Verification (Admins only): residents' uploaded IDs.
const verificationController = require("../controllers/verificationController");
const describeVerification = async (req) => {
    const user = await User.findById(req.params.id);
    const who = user ? (user.email_address || user.username) : `User #${req.params.id}`;
    const reason = req.body.decision === "reject" && typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 200) : "";
    return `${who} → ${req.body.decision === "approve" ? "Approved" : "Rejected"}${reason ? ` (reason: ${reason})` : ""}`;
};
router.get("/verifications", verifyToken, verifyAdmin, verifySuperAdmin, verificationController.list);
router.get("/:id/valid-id", verifyToken, verifyAdmin, verifySuperAdmin, verificationController.getIdDocument);
router.patch("/:id/verification", verifyToken, verifyAdmin, verifySuperAdmin, accountChanged, logActivity("Reviewed account registration", describeVerification), verificationController.decide);
router.put("/:id", verifyToken, verifyAdmin, verifySuperAdmin, accountChanged, logUserStatus, userController.updateUserStatus);
router.patch("/:id/status", verifyToken, verifyAdmin, verifySuperAdmin, accountChanged, logUserStatus, userController.updateUserStatus);
router.patch("/:id/role", verifyToken, verifyAdmin, verifySuperAdmin, accountChanged, logActivity("Changed user role", describeUserChange("role")), userController.updateUserRole);
// Closed accounts: Archived tab.
router.patch("/:id/archive", verifyToken, verifyAdmin, verifySuperAdmin, accountChanged, logActivity("Archived account", describeUserTarget), userController.archiveUser);
router.patch("/:id/restore", verifyToken, verifyAdmin, verifySuperAdmin, accountChanged, logActivity("Restored archived account", describeUserTarget), userController.restoreUser);

router.get("/:id", verifyToken, verifySelfOrAdmin, userController.getUserById);

const profileChanged = accountChanged;

router.post("/:id/photo", verifyToken, verifySelfOrAdmin, profileChanged, upload.single("photo"), userController.uploadPhoto);
router.patch("/:id/name", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateFullName);
router.patch("/:id/username", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateUsername);
router.patch("/:id/contact", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateContact);
router.patch("/:id/address", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateAddress);
router.patch("/:id/email", verifyToken, verifySelfOrAdmin, profileChanged, userController.updateEmail);
router.patch("/:id/password", verifyToken, verifySelfOrAdmin, userController.changePassword);

module.exports = router;
