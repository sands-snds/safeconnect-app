const express = require("express");

const router = express.Router();

const logController = require("../controllers/logController");
const { verifyToken, verifyAdmin, verifySuperAdmin } = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");

// Admin-only: these were previously public.
router.use(verifyToken, verifyAdmin);

// System > Sign-in Logs / Admin Logs: super admin only.
router.get("/signin", verifySuperAdmin, logController.getSigninLogs);

router.get("/admin", verifySuperAdmin, logController.getAdminLogs);

// Auto-archive period per log (signin | admin).
const LOG_NAMES = { signin: "Sign-in logs", admin: "Admin logs" };
const describePeriod = (req) => {
    const days = Number(req.body.days);
    const period = !days ? "turned off" : days === 365 ? "after 1 year" : days === 180 ? "after 6 months" : `after ${days} days`;
    return `${LOG_NAMES[req.params.log] || req.params.log}: auto-archive ${period}`;
};
router.get("/archive-settings/:log", verifySuperAdmin, logController.getArchiveSettings);
router.put("/archive-settings/:log", verifySuperAdmin,
    logActivity("Changed archive settings", describePeriod), logController.updateArchiveSettings);

// Called by the admin panel's Logout button (every admin) so the log shows when an admin left.
router.post("/admin/logout", logController.logAdminLogout);

module.exports = router;
