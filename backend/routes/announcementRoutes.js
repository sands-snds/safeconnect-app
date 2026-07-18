const express = require("express");

const router = express.Router();

const controller = require("../controllers/announcementController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);

router.use(verifyAdmin);

// Routes
router.post("/", controller.createAnnouncement);

router.put("/:id", controller.updateAnnouncement);

router.delete("/:id", controller.deleteAnnouncement);

module.exports = router;