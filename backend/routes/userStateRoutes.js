const express = require("express");

const router = express.Router();

const controller = require("../controllers/userStateController");
const { verifyToken } = require("../middleware/authMiddleware");
const { afterSuccess, notifyUser } = require("../services/liveUpdates");


const stateChanged = afterSuccess((req) => notifyUser(req.user.id, "state"));



router.get("/state", verifyToken, controller.getState);
router.post("/read", verifyToken, stateChanged, controller.markRead);
router.post("/unread", verifyToken, stateChanged, controller.unmark);
router.put("/preferences", verifyToken, stateChanged, controller.updatePreferences);
router.get("/events", verifyToken, controller.events);

module.exports = router;
