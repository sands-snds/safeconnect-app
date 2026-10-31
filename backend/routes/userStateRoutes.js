const express = require("express");

const router = express.Router();

const controller = require("../controllers/userStateController");
const { verifyToken } = require("../middleware/authMiddleware");
const { afterSuccess, notifyUser } = require("../services/liveUpdates");

// Tells the account's other open pages to reload their synced state.
const stateChanged = afterSuccess((req) => notifyUser(req.user.id, "state"));

// The signed-in account's own synced state (residents and admins alike):
// what they've read / dismissed and their language.
router.get("/state", verifyToken, controller.getState);
router.post("/read", verifyToken, stateChanged, controller.markRead);
router.post("/unread", verifyToken, stateChanged, controller.unmark);
router.put("/preferences", verifyToken, stateChanged, controller.updatePreferences);
router.get("/events", verifyToken, controller.events);

module.exports = router;
