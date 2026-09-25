const bcrypt = require("bcrypt");
const User = require("../models/User");
const { ROLES, ALL_ROLES } = require("../utils/roles");

exports.getUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        return res.json(users);
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users."
        });
    }
};

const ALLOWED_STATUSES = ["Active", "Pending", "Suspended", "Closed"];

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
    [ROLES.SUPER_ADMIN]: "User promoted to super admin.",
    [ROLES.ADMIN]: "User changed to admin.",
    [ROLES.RESIDENT]: "User changed to resident."
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

exports.updateUsername = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ success: false, message: "Username is required." });
        }

        const existing = await User.findByUsername(username);
        if (existing && String(existing.id) !== String(req.params.id)) {
            return res.status(409).json({ success: false, message: "Username is already taken." });
        }

        await User.updateUsername(req.params.id, username);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to update username." });
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

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(req.params.id, hashed);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to change password." });
    }
};
