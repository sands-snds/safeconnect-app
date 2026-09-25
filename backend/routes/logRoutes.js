const express = require("express");

const router = express.Router();

const logController = require("../controllers/logController");
const { verifyToken, verifyAdmin, verifySuperAdmin } = require("../middleware/authMiddleware");

// Admin-only: these were previously public.
router.use(verifyToken, verifyAdmin);

// System > Sign-in Logs / Admin Logs: super admin only.
router.get("/signin", verifySuperAdmin, logController.getSigninLogs);

router.get("/admin", verifySuperAdmin, logController.getAdminLogs);

// Called by the admin panel's Logout button (every admin) so the log shows when an admin left.
router.post("/admin/logout", logController.logAdminLogout);

module.exports = router;
