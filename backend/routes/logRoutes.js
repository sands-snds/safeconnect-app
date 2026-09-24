const express = require("express");

const router = express.Router();

const logController = require("../controllers/logController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Admin-only: these were previously public.
router.use(verifyToken, verifyAdmin);

router.get("/signin", logController.getSigninLogs);

router.get("/admin", logController.getAdminLogs);

// Called by the admin panel's Logout button so the log shows when an admin left.
router.post("/admin/logout", logController.logAdminLogout);

module.exports = router;
