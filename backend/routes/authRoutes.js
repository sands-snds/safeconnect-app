const express = require("express");
const router  = express.Router();
const authController = require("../controllers/authController");

// Sign up / Sign in
router.post("/signup",      authController.signup);
router.post("/signin",      authController.signin);

// Email verification (signup OTP)
router.post("/request-otp", authController.requestOtp);
router.post("/verify-otp",  authController.verifyOtp);
router.post("/resend-otp",  authController.resendOtp);

// Forgot password (reset OTP)
router.post("/forgot-password",   authController.forgotPassword);
router.post("/verify-reset-otp",  authController.verifyResetOtp);
router.post("/reset-password",    authController.resetPassword);
router.post("/resend-reset-otp",  authController.resendResetOtp);

module.exports = router;