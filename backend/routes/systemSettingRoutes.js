const express = require("express");

const router = express.Router();

const controller = require("../controllers/systemSettingController");

const {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(verifyAdmin);

// System settings: super admin only.
router.use(verifySuperAdmin);

router.get(
    "/",
    controller.getSettings
);

router.put(
    "/",
    controller.updateSetting
);

module.exports = router;