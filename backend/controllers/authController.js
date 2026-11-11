const bcrypt = require("bcrypt");
const dns    = require("dns").promises;
const User   = require("../models/User");
const AdminActivity = require("../models/AdminActivity");
const { generateToken } = require("../utils/jwt");
const { passwordProblem } = require("../utils/validation");
const { isAdminRole, isSuperAdminRole } = require("../utils/roles");
const Log = require("../models/Log");
const { signinContext, lookupLocation } = require("../utils/signinContext");
const { sendServerError } = require("../utils/dbErrors");
const {
    sendOtpEmail,
    sendSigninNotification,
    sendPasswordResetEmail,
    sendRegistrationReceivedEmail,
} = require("../services/emailService");
const ResidentIdDocument = require("../models/ResidentIdDocument");
const NotificationService = require("../services/notificationService");
const { parseIdUpload } = require("../utils/idDocument");
const { parseAddress, addressOf } = require("../utils/address");
const { parseBirthdate } = require("../utils/birthdate");
const { parseHomePin } = require("../utils/homePin");
const { homePinOf } = require("../utils/homeCoords");



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
        const { fullName, username, contact, email, password, validId } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled.",
            });
        }
        const weakPassword = passwordProblem(password);
        if (weakPassword) return res.status(400).json({ success: false, message: weakPassword });

        // Home address in Santa Fe: filled in when they report for themselves.
        const home = parseAddress(req.body.address);
        if (home.error) return res.json({ success: false, code: "INVALID_ADDRESS", message: home.error });

        // Residents 15 years old and above only (the form checks this too).
        const birth = parseBirthdate(req.body.birthdate);
        if (birth.error) return res.json({ success: false, code: "INVALID_BIRTHDATE", message: birth.error });

        // Their home on the map (required), inside Barangay Santa Fe.
        const home_pin = parseHomePin(req.body.homeLocation);
        if (home_pin.error) return res.json({ success: false, code: "INVALID_HOME_PIN", message: home_pin.error });

        // The ID the barangay checks before the account can sign in.
        const idDocument = parseIdUpload(validId);
        if (idDocument.error) return res.json({ success: false, code: "INVALID_ID", message: idDocument.error });

        const domainValid = await verifyEmailDomain(email);
        if (!domainValid) {
            return res.json({
                success: false,
                message: "This email address does not appear to be valid. Please use a real email address.",
            });
        }

        // A rejected registration can sign up again with the same details.
        const emailExists = await User.findByEmail(email);
        if (emailExists && emailExists.verification_status !== "Rejected") {
            return res.json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        if (username) {
            const usernameExists = await User.findByUsername(username);
            if (usernameExists && usernameExists.verification_status !== "Rejected") {
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
            userData:  { fullName, username, contact, email, password: hashedPassword, address: home.address, birthdate: birth.birthdate, homeLocation: home_pin.pin },
            idDocument,
        });

        for (const [key, val] of otpStore.entries()) {
            if (Date.now() > val.expiresAt) otpStore.delete(key);
        }

        await sendOtpEmail(email, otp);

        return res.json({ success: true, message: "Verification code sent to your email." });
    } catch (error) {
        return sendServerError(res, error, "requestOtp", "Could not send verification email. Please try again.");
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

        const { userData, idDocument } = entry;
        otpStore.delete(email);

        // The account waits for an administrator to check the ID.
        await User.deleteRejected(userData.email, userData.username);
        const userId = await User.create({
            fullName: userData.fullName,
            username: userData.username,
            contact:  userData.contact,
            email:    userData.email,
            password: userData.password,
            role:     "resident",
            status:   "Pending",
            verificationStatus: "Pending",
            address:  userData.address,
            birthdate: userData.birthdate,
            homeLocation: userData.homeLocation,
        });
        try {
            await ResidentIdDocument.save(userId, idDocument);
        } catch (err) {
            // No account without its ID: the person can simply try again.
            await User.deleteById(userId).catch(() => {});
            throw err;
        }

        NotificationService.create({
            title: "New account to verify",
            message: `${userData.fullName} signed up and uploaded a ${idDocument.idType}. Check it on Account Verification.`,
            notificationType: "account_verification",
            referenceId: userId,
        }).catch((err) => console.error("Verification notification failed:", err));

        sendRegistrationReceivedEmail(email, userData.fullName).catch((err) =>
            console.error("Registration email failed:", err)
        );

        return res.json({ success: true, pendingVerification: true, message: "Account created. It will be reviewed by the barangay." });
    } catch (error) {
        return sendServerError(res, error, "verifyOtp", "Something went wrong while creating your account. Please try again.");
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
        return sendServerError(res, error, "resendOtp", "Could not resend verification email.");
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
        return sendServerError(res, error, "forgotPassword", "Could not send reset email. Please try again.");
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
        return sendServerError(res, error, "verifyResetOtp", "Something went wrong while checking the code. Please try again.");
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
        return sendServerError(res, error, "resetPassword", "Something went wrong while changing your password. Please try again.");
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
        return sendServerError(res, error, "resendResetOtp", "Could not resend reset email.");
    }
};


// The old sign-up without an email code or ID. Closed: every account now
// signs up through request-otp / verify-otp so its ID can be checked.
exports.signup = async (req, res) => {
    return res.status(410).json({
        success: false,
        message: "Please sign up with the form on the SafeConnect site, which asks for a valid ID.",
    });
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
                },
                UnderReview: {
                    code: "ACCOUNT_UNDER_REVIEW",
                    message: "Your account is still being reviewed. A barangay administrator is checking your ID; we'll email you once it's approved."
                },
                Rejected: {
                    code: "ACCOUNT_REJECTED",
                    message: "Your registration wasn't approved.",
                    reason: user.verification_note || null
                }
            };
            const key = user.status === "Pending" && user.verification_status === "Pending" ? "UnderReview"
                : user.status === "Pending" && user.verification_status === "Rejected" ? "Rejected"
                : user.status;
            const response = STATUS_RESPONSES[key] || {
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
        return sendServerError(res, err, "signin", "Something went wrong on our side while signing you in. Please try again in a few minutes.");
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
        address:  addressOf(user),
        birthdate: user.birthdate || null,
        homeLocation: homePinOf(user),
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
        sendServerError(res, err, "remember", "Could not save your login.");
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
