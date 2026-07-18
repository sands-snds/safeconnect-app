const express = require("express");

const router = express.Router();

const controller = require("../controllers/systemSettingController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(verifyAdmin);

router.get(
    "/",
    controller.getSettings
);

router.put(
    "/",
    controller.updateSetting
);

module.exports = router;