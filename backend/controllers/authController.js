const bcrypt = require("bcrypt");
const dns    = require("dns").promises;
const User   = require("../models/User");
const { generateToken } = require("../utils/jwt");
const {
    sendOtpEmail,
    sendWelcomeEmail,
    sendSigninNotification,
    sendPasswordResetEmail,
} = require("../services/emailService");

// ── In-memory stores ──────────────────────────────────────────────────────────
// Signup OTPs:  email → { otp, expiresAt, userData }
const otpStore = new Map();
// Reset OTPs:   email → { otp, expiresAt, verified }
const resetStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/* ─────────────────────────────────────────────────────────────────────────────
   EMAIL DOMAIN VALIDATION
   Checks DNS MX records — blocks fake domains (@notreal.xyz) while accepting
   all real providers: Gmail, Yahoo, Outlook, school emails, company emails, etc.
───────────────────────────────────────────────────────────────────────────── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const verifyEmailDomain = async (email) => {
    if (!EMAIL_REGEX.test(email)) return false;
    const domain = email.split("@")[1].toLowerCase();
    try {
        const mxRecords = await dns.resolveMx(domain);
        return Array.isArray(mxRecords) && mxRecords.length > 0;
    } catch {
        return false;
    }
};

/* =========================================================
   STEP 1 — REQUEST SIGNUP OTP
   POST /api/auth/request-otp
============================================================*/
exports.requestOtp = async (req, res) => {
    try {
        const { fullName, username, contact, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled.",
            });
        }

        const domainValid = await verifyEmailDomain(email);
        if (!domainValid) {
            return res.json({
                success: false,
                message: "This email address does not appear to be valid. Please use a real email address.",
            });
        }

        const emailExists = await User.findByEmail(email);
        if (emailExists) {
            return res.json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        if (username) {
            const usernameExists = await User.findByUsername(username);
            if (usernameExists) {
                return res.json({
                    success: false,
                    message: "Username is already taken.",
                });
            }
        }

        const otp            = generateOtp();
        const hashedPassword = await bcrypt.hash(password, 10);

        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            userData:  { fullName, username, contact, email, password: hashedPassword },
        });

        for (const [key, val] of otpStore.entries()) {
            if (Date.now() > val.expiresAt) otpStore.delete(key);
        }

        await sendOtpEmail(email, otp);

        return res.json({ success: true, message: "Verification code sent to your email." });
    } catch (error) {
        console.error("requestOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not send verification email. Please try again.",
        });
    }
};

/* =========================================================
   STEP 2 — VERIFY SIGNUP OTP + CREATE ACCOUNT
   POST /api/auth/verify-otp
============================================================*/
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required.",
            });
        }

        const entry = otpStore.get(email);
        if (!entry) {
            return res.json({
                success: false,
                message: "Verification code not found. Please request a new one.",
            });
        }

        if (Date.now() > entry.expiresAt) {
            otpStore.delete(email);
            return res.json({
                success: false,
                message: "Verification code has expired. Please request a new one.",
            });
        }

        if (entry.otp !== String(otp).trim()) {
            return res.json({ success: false, message: "Incorrect verification code." });
        }

        const { userData } = entry;
        otpStore.delete(email);

        await User.create({
            fullName: userData.fullName,
            username: userData.username,
            contact:  userData.contact,
            email:    userData.email,
            password: userData.password,
            role:     "resident",
        });

        sendWelcomeEmail(email, userData.fullName).catch((err) =>
            console.error("Welcome email failed:", err)
        );

        return res.json({ success: true, message: "Account created successfully." });
    } catch (error) {
        console.error("verifyOtp error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/* =========================================================
   RESEND SIGNUP OTP
   POST /api/auth/resend-otp
============================================================*/
exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const entry = otpStore.get(email);
        if (!entry) {
            return res.json({
                success: false,
                message: "No pending registration found for this email.",
            });
        }

        const otp       = generateOtp();
        entry.otp       = otp;
        entry.expiresAt = Date.now() + OTP_TTL_MS;
        otpStore.set(email, entry);

        await sendOtpEmail(email, otp);

        return res.json({ success: true, message: "A new verification code has been sent." });
    } catch (error) {
        console.error("resendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not resend verification email.",
        });
    }
};

/* =========================================================
   FORGOT PASSWORD — STEP 1: SEND RESET OTP
   POST /api/auth/forgot-password
============================================================*/
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required.",
            });
        }

        // Always return a generic success so we don't reveal
        // whether an account exists for a given email.
        const user = await User.findByEmail(email);
        if (!user) {
            return res.json({
                success: true,
                message: "If an account with that email exists, a reset code has been sent.",
            });
        }

        const otp = generateOtp();
        resetStore.set(email, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            verified:  false,
        });

        // Clean up expired entries
        for (const [key, val] of resetStore.entries()) {
            if (Date.now() > val.expiresAt) resetStore.delete(key);
        }

        await sendPasswordResetEmail(email, user.full_name, otp);

        return res.json({
            success: true,
            message: "If an account with that email exists, a reset code has been sent.",
        });
    } catch (error) {
        console.error("forgotPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not send reset email. Please try again.",
        });
    }
};

/* =========================================================
   FORGOT PASSWORD — STEP 2: VERIFY RESET OTP
   POST /api/auth/verify-reset-otp
============================================================*/
exports.verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required.",
            });
        }

        const entry = resetStore.get(email);
        if (!entry) {
            return res.json({
                success: false,
                message: "Verification code not found. Please request a new one.",
            });
        }

        if (Date.now() > entry.expiresAt) {
            resetStore.delete(email);
            return res.json({
                success: false,
                message: "Verification code has expired. Please request a new one.",
            });
        }

        if (entry.otp !== String(otp).trim()) {
            return res.json({ success: false, message: "Incorrect verification code." });
        }

        // Mark as verified — user can now submit a new password
        entry.verified = true;
        resetStore.set(email, entry);

        return res.json({ success: true, message: "Code verified. You can now set a new password." });
    } catch (error) {
        console.error("verifyResetOtp error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/* =========================================================
   FORGOT PASSWORD — STEP 3: SET NEW PASSWORD
   POST /api/auth/reset-password
============================================================*/
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email and new password are required.",
            });
        }

        const entry = resetStore.get(email);
        if (!entry || !entry.verified) {
            return res.json({
                success: false,
                message: "Please verify your email with the reset code first.",
            });
        }

        if (Date.now() > entry.expiresAt) {
            resetStore.delete(email);
            return res.json({
                success: false,
                message: "Your session has expired. Please start the reset process again.",
            });
        }

        if (newPassword.length < 8) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters.",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user           = await User.findByEmail(email);

        if (!user) {
            return res.json({ success: false, message: "Account not found." });
        }

        // Update password in DB
        await User.updatePassword(user.id, hashedPassword);

        // Clean up reset entry
        resetStore.delete(email);

        return res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/* =========================================================
   RESEND RESET OTP
   POST /api/auth/resend-reset-otp
============================================================*/
exports.resendResetOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.json({
                success: true,
                message: "If an account with that email exists, a new code has been sent.",
            });
        }

        const otp = generateOtp();
        resetStore.set(email, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            verified:  false,
        });

        await sendPasswordResetEmail(email, user.full_name, otp);

        return res.json({
            success: true,
            message: "A new reset code has been sent to your email.",
        });
    } catch (error) {
        console.error("resendResetOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not resend reset email.",
        });
    }
};

/* =========================================================
   SIGN UP — backwards-compatible direct path (no OTP)
============================================================*/
exports.signup = async (req, res) => {
    try {
        const { fullName, username, contact, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled.",
            });
        }

        const emailExists = await User.findByEmail(email);
        if (emailExists) {
            return res.json({ success: false, message: "An account with this email already exists." });
        }

        if (username) {
            const usernameExists = await User.findByUsername(username);
            if (usernameExists) {
                return res.json({ success: false, message: "Username is already taken." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ fullName, username, contact, email, password: hashedPassword, role: "resident" });

        return res.json({ success: true, message: "Account created successfully." });
    } catch (error) {
        console.error("Signup Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================================================
   SIGN IN
============================================================*/
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const user = await User.findByEmail(email);

        if (!user) {
            await User.logSignin("Unknown User", email, "Failed");
            return res.json({ success: false, message: "Invalid email or password." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await User.logSignin(user.full_name, email, "Failed");
            return res.json({ success: false, message: "Invalid email or password." });
        }

        if (user.status && user.status !== "Active") {
            await User.logSignin(user.full_name, email, "Failed");
            const STATUS_MESSAGES = {
                Pending:   "Your account is still pending approval.",
                Suspended: "Your account has been suspended. Please contact an administrator.",
                Closed:    "This account has been closed.",
            };
            return res.json({
                success: false,
                message: STATUS_MESSAGES[user.status] || "Your account cannot sign in right now.",
            });
        }

        await User.logSignin(user.full_name, email, "Success");
        if (user.role === "admin") await User.logAdminSignin(email);

        sendSigninNotification(email, user.full_name).catch((err) =>
            console.error("Sign-in notification email failed:", err)
        );

        const token = generateToken(user);

        return res.json({
            success: true,
            isAdmin: user.role === "admin",
            token,
            user: {
                id:       user.id,
                fullName: user.full_name,
                username: user.username,
                contact:  user.contact_number,
                email:    user.email_address,
                role:     user.role,
            },
            message: "Login successful",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};