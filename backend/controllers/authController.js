const bcrypt = require("bcrypt");
const dns    = require("dns").promises;
const User   = require("../models/User");
const AdminActivity = require("../models/AdminActivity");
const { generateToken } = require("../utils/jwt");
const { passwordProblem } = require("../utils/validation");
const { isAdminRole, isSuperAdminRole } = require("../utils/roles");
const Log = require("../models/Log");
const { signinContext, lookupLocation } = require("../utils/signinContext");
const {
    sendOtpEmail,
    sendWelcomeEmail,
    sendSigninNotification,
    sendPasswordResetEmail,
} = require("../services/emailService");



const otpStore = new Map();

const resetStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));


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


exports.requestOtp = async (req, res) => {
    try {
        const { fullName, username, contact, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled.",
            });
        }
        const weakPassword = passwordProblem(password);
        if (weakPassword) return res.status(400).json({ success: false, message: weakPassword });

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


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required.",
            });
        }

        
        
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

        
        entry.verified = true;
        resetStore.set(email, entry);

        return res.json({ success: true, message: "Code verified. You can now set a new password." });
    } catch (error) {
        console.error("verifyResetOtp error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email and new password are required.",
            });
        }
        const weakPassword = passwordProblem(newPassword);
        if (weakPassword) return res.status(400).json({ success: false, message: weakPassword });

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

        const user = await User.findByEmail(email);

        if (!user) {
            return res.json({ success: false, message: "Account not found." });
        }

        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.json({
                success: false,
                message: "New password must be different from your current password.",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

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


exports.signup = async (req, res) => {
    try {
        const { fullName, username, contact, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled.",
            });
        }
        const weakPassword = passwordProblem(password);
        if (weakPassword) return res.status(400).json({ success: false, message: weakPassword });

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




const recordSignin = async (req, fullName, email, status) => {
    const ctx = signinContext(req);
    const id = await Log.logSignin(fullName, email, status, ctx);
    lookupLocation(ctx.ip)
        .then((location) => location && Log.setSigninLocation(id, location))
        .catch((err) => console.error("Sign-in location lookup failed:", err.message));
};

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
            await recordSignin(req, "Unknown User", email, "Failed");
            return res.json({ success: false, message: "Invalid email or password." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await recordSignin(req, user.full_name, email, "Failed");
            return res.json({ success: false, message: "Invalid email or password." });
        }

        if (user.status && user.status !== "Active") {
            await recordSignin(req, user.full_name, email, "Failed");
            
            
            const STATUS_RESPONSES = {
                Suspended: {
                    code: "ACCOUNT_SUSPENDED",
                    message: "Your account has been suspended, so you can't sign in right now. Please contact the Barangay Sta. Fe administrator to resolve this."
                },
                Closed: {
                    code: "ACCOUNT_CLOSED",
                    message: "This account has been permanently closed and can no longer be used to sign in. If you believe this is a mistake, please contact the Barangay Sta. Fe administrator."
                },
                
                Pending: {
                    code: "ACCOUNT_PENDING",
                    message: "Your account isn't active yet. Please contact the Barangay Sta. Fe administrator."
                }
            };
            const response = STATUS_RESPONSES[user.status] || {
                code: "ACCOUNT_INACTIVE",
                message: "Your account can't sign in right now. Please contact the Barangay Sta. Fe administrator."
            };
            return res.json({ success: false, ...response });
        }

        await recordSignin(req, user.full_name, email, "Success");
        if (isAdminRole(user.role)) await AdminActivity.record(user, "Logged in");

        sendSigninNotification(email, user.full_name).catch((err) =>
            console.error("Sign-in notification email failed:", err)
        );

        const token = generateToken(user);

        return res.json({
            success: true,
            isAdmin: isAdminRole(user.role),
            isSuperAdmin: isSuperAdminRole(user.role),
            token,
            user: toPublicUser(user),
            message: "Login successful",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


function toPublicUser(user) {
    const assetBase = process.env.ASSET_BASE || `http://localhost:${process.env.PORT || 5000}`;
    const photo = user.photo_url;
    let photoUrl = null;
    if (photo) {
        photoUrl = /^https?:\/\//.test(photo) || photo.startsWith("data:") ? photo : `${assetBase}${photo}`;
    }
    return {
        id:       user.id,
        fullName: user.full_name,
        username: user.username,
        contact:  user.contact_number,
        email:    user.email_address,
        role:     user.role,
        photoUrl,
    };
}




exports.me = (req, res) => {
    res.json({
        success: true,
        isAdmin: isAdminRole(req.account.role),
        user: toPublicUser(req.account)
    });
};



exports.remember = async (req, res) => {
    try {
        const RememberedLogin = require("../models/RememberedLogin");
        
        if (req.user.jti) await RememberedLogin.delete(req.user.jti);
        const rememberedId = await RememberedLogin.create(req.account.id, req.headers["user-agent"]);
        res.json({
            success: true,
            token: generateToken(req.account, { rememberedId }),
            days: RememberedLogin.REMEMBER_DAYS
        });
    } catch (err) {
        console.error("remember error:", err);
        res.status(500).json({ success: false, message: "Could not save your login." });
    }
};




exports.logout = async (req, res) => {
    try {
        if (req.user.jti) await require("../models/RememberedLogin").delete(req.user.jti);
        res.json({ success: true });
    } catch (err) {
        console.error("logout error:", err);
        res.status(500).json({ success: false, message: "Could not sign out." });
    }
};
