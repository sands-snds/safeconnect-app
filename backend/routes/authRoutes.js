const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup",      authController.signup);
router.post("/signin",      authController.signin);
router.post("/request-otp", authController.requestOtp);
router.post("/verify-otp",  authController.verifyOtp);
router.post("/resend-otp",  authController.resendOtp);

module.exports = router;