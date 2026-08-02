const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboardController");

const {
    verifyToken,
    verifyAdmin
} = require("../middleware/authMiddleware");

router.use(verifyToken);
router.use(verifyAdmin);

router.get(
    "/",
    dashboardController.getDashboard
);

module.exports = router;