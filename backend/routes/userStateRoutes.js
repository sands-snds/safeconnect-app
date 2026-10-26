const express = require("express");

const router = express.Router();

const controller = require("../controllers/userStateController");
const { verifyToken } = require("../middleware/authMiddleware");

// The signed-in account's own synced state (residents and admins alike):
// what they've read / dismissed and their language.
router.get("/state", verifyToken, controller.getState);
router.post("/read", verifyToken, controller.markRead);
router.put("/preferences", verifyToken, controller.updatePreferences);

module.exports = router;
