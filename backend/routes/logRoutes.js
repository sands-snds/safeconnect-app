const express = require("express");

const router = express.Router();

const logController = require("../controllers/logController");

router.get("/signin", logController.getSigninLogs);

router.get("/admin", logController.getAdminLogs);

module.exports = router;