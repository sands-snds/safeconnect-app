// Cross-resource report routes. Type-specific CRUD lives in
// emergencyReportRoutes.js, assistanceRequestRoutes.js, and
// pettyCrimeRoutes.js — this file only handles the aggregate
// "my reports" view used by MyReportsPage.jsx.
const express = require("express");
const router = express.Router();

const myReportsController = require("../controllers/myReportsController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/user/:userId", verifyToken, myReportsController.getMyReports);

module.exports = router;
