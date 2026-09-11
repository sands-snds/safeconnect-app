const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const {
    sendOtpEmail,
    sendWelcomeEmail,
    sendSigninNotification,
} = require("../services/emailService");

// In-memory OTP store: { email -> { otp, expiresAt, userData } }
// For production, replace with Redis or a DB table.
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const generateOtp = () =>
    String(Math.floor(100000 + Math.random() * 900000));

/* =========================================================
   STEP 1 — REQUEST OTP
   POST /api/auth/request-otp
   Validates the signup fields, then emails an OTP.
   The account is NOT created yet.
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

        // Check duplicates before sending OTP
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

        const otp = generateOtp();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store OTP + hashed user data until verified
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            userData: { fullName, username, contact, email, password: hashedPassword },
        });

        // Clean up expired entries while we're here
        for (const [key, val] of otpStore.entries()) {
            if (Date.now() > val.expiresAt) otpStore.delete(key);
        }

        await sendOtpEmail(email, otp);

        return res.json({
            success: true,
            message: "Verification code sent to your email.",
        });
    } catch (error) {
        console.error("requestOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not send verification email. Please try again.",
        });
    }
};

/* =========================================================
   STEP 2 — VERIFY OTP + CREATE ACCOUNT
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
            return res.json({
                success: false,
                message: "Incorrect verification code.",
            });
        }

        // OTP is valid — create the account now
        const { userData } = entry;
        otpStore.delete(email);

        await User.create({
            fullName: userData.fullName,
            username: userData.username,
            contact: userData.contact,
            email: userData.email,
            password: userData.password, // already hashed
            role: "resident",
        });

        // Send welcome email (non-blocking — don't fail signup if this errors)
        sendWelcomeEmail(email, userData.fullName).catch((err) =>
            console.error("Welcome email failed:", err)
        );

        return res.json({
            success: true,
            message: "Account created successfully.",
        });
    } catch (error) {
        console.error("verifyOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

/* =========================================================
   RESEND OTP
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

        const otp = generateOtp();
        entry.otp = otp;
        entry.expiresAt = Date.now() + OTP_TTL_MS;
        otpStore.set(email, entry);

        await sendOtpEmail(email, otp);

        return res.json({
            success: true,
            message: "A new verification code has been sent.",
        });
    } catch (error) {
        console.error("resendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not resend verification email.",
        });
    }
};

/* =========================================================
   SIGN UP (kept for backwards compatibility — now just
   an alias that goes straight through without OTP, used
   only if you ever call it directly. The frontend uses
   request-otp → verify-otp instead.)
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
                Pending: "Your account is still pending approval.",
                Suspended: "Your account has been suspended. Please contact an administrator.",
                Closed: "This account has been closed.",
            };
            return res.json({
                success: false,
                message: STATUS_MESSAGES[user.status] || "Your account cannot sign in right now.",
            });
        }

        await User.logSignin(user.full_name, email, "Success");
        if (user.role === "admin") await User.logAdminSignin(email);

        // Send sign-in notification (non-blocking)
        sendSigninNotification(email, user.full_name).catch((err) =>
            console.error("Sign-in notification email failed:", err)
        );

        const token = generateToken(user);

        return res.json({
            success: true,
            isAdmin: user.role === "admin",
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                username: user.username,
                contact: user.contact_number,
                email: user.email_address,
                role: user.role,
            },
            message: "Login successful",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};