const express = require("express");

const router = express.Router();

const controller = require("../controllers/notificationController");

router.get("/", controller.getNotifications);

router.put("/:id/read", controller.markAsRead);

module.exports = router;