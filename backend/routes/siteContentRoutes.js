const express = require("express");
const router = express.Router();

const controller = require("../controllers/siteContentController");
const { verifyToken, verifyAdmin, verifySuperAdmin } = require("../middleware/authMiddleware");
const { logActivity } = require("../middleware/activityLogger");

// Public: emergency contacts, footer officials and socials.
router.get("/", controller.getContent);

// Admin (super_admin) only: System > Site Contacts.
router.put("/", verifyToken, verifyAdmin, verifySuperAdmin,
    logActivity("Updated site contacts", () => "Emergency contacts, officials and socials"),
    controller.updateContent);

module.exports = router;
