const express = require("express");
const { logResidentActivity } = require("../middleware/residentActivity");
const router  = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Sign up / Sign in
router.post("/signup",      authController.signup);
router.post("/signin",      authController.signin);

// Continue with Google (residents): sign in, or finish a new account
router.post("/google",          authController.googleSignin);
router.post("/google/complete", authController.googleComplete);

// The signed-in account (verifies the token against the database)
router.get("/me",          verifyToken, authController.me);

// "Save Login Info": Yes swaps the session sign-in for a 30-day saved login;
// logout revokes a saved login on the server (models/RememberedLogin.js)
router.post("/remember",   verifyToken, authController.remember);
router.post("/logout",     verifyToken, logResidentActivity("Signed out"), authController.logout);

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