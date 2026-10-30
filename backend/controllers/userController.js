const bcrypt = require("bcrypt");
const User = require("../models/User");
const RememberedLogin = require("../models/RememberedLogin");
const { generateToken } = require("../utils/jwt");
const { passwordProblem, fullNameProblem, normalizeName } = require("../utils/validation");
const { ROLES, ALL_ROLES, roleLabel, isMainAccount } = require("../utils/roles");

const MAIN_ACCOUNT_LOCKED = "This is the barangay's main Admin account. Its role, status and email can't be changed.";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches the +63 + 10-digit format the resident sign-up/settings forms
// always submit (a "+63" prefix badge next to a 10-digit numeric input).
const PH_CONTACT_REGEX = /^\+63\d{10}$/;

exports.getUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        // is_main_account: the barangay's own account, which can't be changed.
        return res.json(users.map((u) => ({ ...u, is_main_account: isMainAccount(u.email_address) })));
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users."
        });
    }
};

// "Pending" is no longer offered: accounts are usable as soon as the email
// is verified. Older Pending accounts can still be moved to another status.
const ALLOWED_STATUSES = ["Active", "Suspended", "Closed"];

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}.`
            });
        }

        // An admin suspending/closing their own account would lock them out.
        if (String(req.user.id) === String(id)) {
            return res.status(400).json({
                success: false,
                message: "You can't change the status of your own account."
            });
        }

        const target = await User.findById(id);
        if (!target) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (isMainAccount(target.email_address)) {
            return res.status(403).json({ success: false, message: MAIN_ACCOUNT_LOCKED });
        }

        await User.updateStatus(id, status);
        return res.json({
            success: true,
            message: "User status updated."
        });
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to update user."
        });
    }
};

const ALLOWED_ROLES = ALL_ROLES;

const ROLE_CHANGE_MESSAGES = {
    [ROLES.SUPER_ADMIN]: `User is now an ${roleLabel(ROLES.SUPER_ADMIN)}.`,
    [ROLES.ADMIN]: `User is now an ${roleLabel(ROLES.ADMIN)}.`,
    [ROLES.RESIDENT]: `User is now a ${roleLabel(ROLES.RESIDENT)}.`
};

// Change a user's role (resident / admin / super admin). Super admin only.
// verifyAdmin reads the role from the database, so this takes effect on the
// account's very next request -- no re-login needed.
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`
            });
        }

        // Also guarantees there's always at least one admin left.
        if (String(req.user.id) === String(id)) {
            return res.status(400).json({
                success: false,
                message: "You can't change the role of your own account."
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (isMainAccount(user.email_address)) {
            return res.status(403).json({ success: false, message: MAIN_ACCOUNT_LOCKED });
        }

        await User.updateRole(id, role);
        return res.json({
            success: true,
            message: ROLE_CHANGE_MESSAGES[role]
        });
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to update user role."
        });
    }
};

/* =========================================================
        Profile Self-Service (SettingsPage.jsx / MyReportsPage.jsx)
============================================================*/

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No photo uploaded." });
        }
        const photoUrl = `/uploads/${req.file.filename}`;
        await User.updatePhoto(req.params.id, photoUrl);
        return res.json({ success: true, photoUrl });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to upload photo." });
    }
};

exports.updateFullName = async (req, res) => {
    try {
        const problem = fullNameProblem(req.body.fullName);
        if (problem) return res.status(400).json({ success: false, message: problem });

        const fullName = normalizeName(req.body.fullName);
        await User.updateFullName(req.params.id, fullName);
        return res.json({ success: true, fullName });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to update full name." });
    }
};

exports.updateUsername = async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        if (!username) {
            return res.status(400).json({ success: false, message: "Username is required." });
        }
        if (username.length > 50) {
            return res.status(400).json({ success: false, message: "Username must be 50 characters or fewer." });
        }

        const existing = await User.findByUsername(username);
        if (existing && String(existing.id) !== String(req.params.id)) {
            return res.status(409).json({ success: false, message: "Username is already taken." });
        }

        await User.updateUsername(req.params.id, username);
        return res.json({ success: true, username });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to update username." });
    }
};

exports.updateContact = async (req, res) => {
    try {
        const { contact } = req.body;
        if (!contact || !PH_CONTACT_REGEX.test(contact)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid mobile number (+63 followed by 10 digits)."
            });
        }

        await User.updateContact(req.params.id, contact);
        return res.json({ success: true, contact });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to update contact number." });
    }
};

exports.updateEmail = async (req, res) => {
    try {
        const { email, currentPassword } = req.body;

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }
        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: "Please enter your current password to confirm this change."
            });
        }

        const user = await User.findByIdWithPassword(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (isMainAccount(user.email_address)) {
            return res.status(403).json({ success: false, message: MAIN_ACCOUNT_LOCKED });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }

        const existing = await User.findByEmail(email);
        if (existing && String(existing.id) !== String(req.params.id)) {
            return res.status(409).json({ success: false, message: "That email address is already in use." });
        }

        await User.updateEmail(req.params.id, email);
        return res.json({ success: true, email });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to update email address." });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current and new password are required." });
        }

        const user = await User.findByIdWithPassword(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }
        const weakPassword = passwordProblem(newPassword);
        if (weakPassword) return res.status(400).json({ success: false, message: weakPassword });

        const hashed = await bcrypt.hash(newPassword, 10);
        // Also signs the account out of every saved login (User.updatePassword).
        await User.updatePassword(req.params.id, hashed);

        // Keep the person who changed it signed in on this device: if they
        // were on a saved login, give this device a fresh one to replace the
        // one that was just revoked. Other devices stay signed out.
        let token;
        if (req.user?.jti && String(req.user.id) === String(req.params.id)) {
            const rememberedId = await RememberedLogin.create(user.id, req.headers["user-agent"]);
            token = generateToken(user, { rememberedId });
        }
        return res.json({ success: true, ...(token ? { token } : {}) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to change password." });
    }
};


// System > Users: move a Closed account to the Archived tab, or back.
const setUserArchived = (archived) => async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: "User not found." });
        if (isMainAccount(target.email_address)) {
            return res.status(403).json({ success: false, message: MAIN_ACCOUNT_LOCKED });
        }
        if (archived && target.status !== "Closed") {
            return res.status(400).json({ success: false, message: "Only closed accounts can be archived." });
        }
        await User.setArchived(req.params.id, archived);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: `Failed to ${archived ? "archive" : "restore"} the account.` });
    }
};
exports.archiveUser = setUserArchived(true);
exports.restoreUser = setUserArchived(false);
